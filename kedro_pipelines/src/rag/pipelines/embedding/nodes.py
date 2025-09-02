import re
import logging
import unicodedata
from functools import partial

from langchain.document_loaders import PyMuPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_core.documents.base import Document
from langchain_huggingface import HuggingFaceEmbeddings
from tqdm import tqdm
from transformers import AutoTokenizer


LOGGER = logging.getLogger(__name__)


def count_tokens_with_tokenizer(text: str, tokenizer: AutoTokenizer) -> int:
    """
    Count the number of tokens in a text using the provided tokenizer.

    Args:
        text (str): The text to tokenize.
        tokenizer (AutoTokenizer): The tokenizer to use.

    Returns:
        int: The number of tokens in the text.
    """
    return len(tokenizer.encode(text))


def normalize_text(text: str) -> str:
    """Convert to lowercase and remove accents

    Args:
        text (str): text to normalize

    Returns:
        str: normalized text
    """
    text = text.lower()
    text = ''.join(c for c in unicodedata.normalize('NFD', text)
                   if unicodedata.category(c) != 'Mn')
    return text


def sanitize_chunk(chunk: str, suspicious_patterns: list[str]) -> str:
    """
    Clean text chunk to mitigate prompt injection risks.

    Args:
        chunk (str): Original chunk, extracted from PDF.
        suspicious_patterns (list[str]): List of regex patterns to remove.

    Returns:
        str: sanitized chunk
    """
    original_chunk = chunk

    # Unicode normalisation
    chunk = unicodedata.normalize("NFKC", chunk)

    # Normalize for matching
    normalized_chunk = normalize_text(chunk)  

    # Remove suspicious patterns
    for pat in suspicious_patterns:
        pattern = re.compile(pat, flags=re.IGNORECASE)
        matches = pattern.findall(normalized_chunk)
        if matches:
            chunk = pattern.sub("[REDACTED]", chunk)
            normalized_chunk = pattern.sub("[REDACTED]", normalized_chunk)

    # Remove invisible control characters (except \n and \t)
    chunk = re.sub(r"[\x00-\x08\x0B-\x1F\x7F]", "", chunk)

    if chunk != original_chunk:
        print(" Warning : possible injection detected. Chunk modified.")

    return chunk


def process_chunks(chunks: list[Document],
                   pdf_metadata_map: dict[str, str],
                   file_path: str,
                   suspicious_patterns: list[str]) -> list[Document]:
    """
    Apply all processing steps on a list of chunks:
    1. Add original filename to metadata
    2. Sanitize the text to remove suspicious patterns

    Args:
        chunks (list[Document]): Chunks from a single PDF
        pdf_metadata_map (dict[str, str]): Mapping from PDF path to filename
        file_path (str): Current PDF file path
        suspicious_patterns (list[str]): List of regex patterns to remove.

    Returns:
        list[Document]: List of processed chunks
    """
    filename = pdf_metadata_map.get(file_path)
    if not filename:
        filename = "unknown"
        LOGGER.warning(f"No original filename found for {file_path}")

    processed_chunks = []
    for chunk in chunks:
        chunk.metadata["original_filename"] = filename
        cleaned_text = sanitize_chunk(chunk.page_content, suspicious_patterns)
        processed_chunks.append(
            Document(
                page_content=cleaned_text,
                metadata=chunk.metadata
            )
        )
    return processed_chunks


def split_pdfs_into_chunks(
    pdf_paths: list[str],
    pdf_metadata_map: dict[str, str],
    embedding_model_name: str,
    chunk_size: int,
    chunk_overlap: int,
    separators: list[str],
    suspicious_patterns: list[str]
) -> list[Document]:
    """
    Load each PDF from a list of paths, extract their content,
    and split them into chunks suitable for embedding,
    using the tokenizer of the embedding model to measure chunk size.

    Args:
        pdf_paths (list[str]): List of PDF file paths to process.
        pdf_metadata_map (dict[str, str]): Mapping from PDF file path to original filename.
        embedding_model_name (str): Path or name of the pre-trained model to use for tokenization.
        chunk_size (int): Maximum size of each chunk (in tokens).
        chunk_overlap (int): Number of overlapping tokens between consecutive chunks.
        separators (list[str]): List of separators to use for splitting text (e.g., ["\n\n", "\n"]).
        suspicious_patterns (list[str]): List of regex patterns to remove.

    Returns:
        list[Document]: List of Langchain Document chunks for each PDF.
    """
    tokenizer_embedding = AutoTokenizer.from_pretrained(embedding_model_name)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=partial(
            count_tokens_with_tokenizer, tokenizer=tokenizer_embedding
        ),
        separators=separators,
    )

    all_docs_chunks = []
    for i in tqdm(range(len(pdf_paths)), desc="Parsing pdf files ...", unit="files"):
        loader = PyMuPDFLoader(pdf_paths[i])
        pdf_pages_list = loader.load()
        chunks = text_splitter.split_documents(pdf_pages_list)
        processed_chunks = process_chunks(chunks,
                                          pdf_metadata_map,
                                          pdf_paths[i],
                                          suspicious_patterns)
        all_docs_chunks.extend(processed_chunks)

    return all_docs_chunks


def create_faiss_vectorstore_from_chunks(
    chunks: list[Document], embedding_model_name: str
) -> FAISS:
    """
    Generate vector embeddings for a list of document chunks and store them in a FAISS vectorstore.

    Args:
        chunks (list[Document]): List of Langchain Document chunks to embed.
        embedding_model_path (str): Path or name of the pre-trained embedding model.

    Returns:
        FAISS: A FAISS vectorstore containing the embedded document chunks.
    """
    embedding_function = HuggingFaceEmbeddings(model_name=embedding_model_name)
    list_ids = [n for n in range(len(chunks))]

    LOGGER.info(f"Creating embeddings for {len(chunks)} chunks...")

    db = FAISS.from_documents(chunks, embedding_function, ids=list_ids)

    LOGGER.info(
        f"Successfully generated embeddings for {db.index.ntotal} chunks. "
        f"Each embedding has a vector size of {db.index.d} "
    )

    return db
