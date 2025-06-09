import logging
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


def split_pdfs_into_chunks(
    pdf_paths: list[str],
    embedding_model_name: str,
    chunk_size: int,
    chunk_overlap: int,
    separators: list[str],
) -> list[Document]:
    """
    Load each PDF from a list of paths, extract their content, and split them into chunks
    suitable for embedding, using the tokenizer of the embedding model to measure chunk size.

    Args:
        pdf_paths (list[str]): List of PDF file paths to process.
        embedding_model_name (str): Path or name of the pre-trained model to use for tokenization.
        chunk_size (int): Maximum size of each chunk (in tokens).
        chunk_overlap (int): Number of overlapping tokens between consecutive chunks.
        separators (list[str]): List of separators to use for splitting text (e.g., ["\n\n", "\n"]).

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
        all_docs_chunks.extend(text_splitter.split_documents(pdf_pages_list))

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
