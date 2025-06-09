import logging

from langchain_community.vectorstores import FAISS
from langchain_core.documents.base import Document

LOGGER = logging.getLogger(__name__)


def retrieve_relevant_chunks(
    question: str,
    vectorstore: FAISS,
    retriever_config: dict[str, any],
    top_k: int,
) -> list[Document]:
    """
    Retrieve the top-k most relevant document chunks for a given question using a FAISS vectorstore.

    Args:
        question (str): The user's question.
        vectorstore (FAISS): FAISS vectorstore containing embedded document chunks.
        retriever_config (dict): Configuration for the retriever.
        top_k (int): Number of top relevant chunks to return.

    Returns:
        list[Document]: List of the most relevant document chunks.
    """
    base_retriever = vectorstore.as_retriever(**retriever_config)
    relevant_chunks = base_retriever.invoke(question)[:top_k]

    LOGGER.info(f"{len(relevant_chunks)} relevant chunks retrieved from vectorstore")

    return relevant_chunks
