import logging
from pathlib import Path

from langchain.prompts import PromptTemplate
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


def format_context(relevant_chunks: list[Document]) -> str:
    """
    Format a list of relevant document chunks into a single context string for prompting.

    Args:
        relevant_chunks (list[Document]): List of relevant document chunks.

    Returns:
        str: Formatted context string.
    """
    context_list = []
    for n, doc in enumerate(relevant_chunks):
        title = Path(doc.metadata["original_filename"]).stem
        content = doc.page_content
        context_list.append(f"Extrait du document '{title}' :\n{content}")

    return "\n".join(context_list)


def build_prompt_with_context_and_question(
    prompt_template: str, context: str, question: str
) -> str:
    """
    Build a prompt for the LLM by injecting the context and question into a template.

    Args:
        prompt_template (str): The prompt template with placeholders for context and question.
        context (str): The formatted context string.
        question (str): The user's question.

    Returns:
        str: The final prompt ready for the LLM.
    """
    prompt = PromptTemplate(
        template=prompt_template, input_variables=["context", "question"]
    )
    prompt_text = prompt.format(context=context, question=question)

    return prompt_text
