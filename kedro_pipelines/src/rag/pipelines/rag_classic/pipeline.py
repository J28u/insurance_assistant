from kedro.pipeline import Pipeline, node

from .nodes import (
    build_prompt_with_context_and_question,
    format_context,
    retrieve_relevant_chunks,
)


def create_classic_rag_pipeline(**kwargs) -> Pipeline:
    return Pipeline(
        [
            node(
                retrieve_relevant_chunks,
                inputs=dict(
                    question="question",
                    vectorstore="vectorstore",
                    retriever_config="params:retriever_config",
                    top_k="params:top_k_retriever",
                ),
                outputs="relevant_chunks",
                name="retriever_node",
            ),
            node(
                format_context,
                inputs=dict(
                    relevant_chunks="relevant_chunks",
                ),
                outputs="formatted_context",
                name="format_context",
            ),
            node(
                build_prompt_with_context_and_question,
                inputs=dict(
                    prompt_template="prompt_template",
                    context="formatted_context",
                    question="question",
                ),
                outputs="rag_prompt",
            ),
        ]
    )
