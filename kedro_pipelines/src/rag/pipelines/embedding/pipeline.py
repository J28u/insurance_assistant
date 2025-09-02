from kedro.pipeline import Pipeline, node

from .nodes import create_faiss_vectorstore_from_chunks, split_pdfs_into_chunks


def create_embedding_pipeline(**kwargs) -> Pipeline:
    return Pipeline(
        [
            node(
                split_pdfs_into_chunks,
                inputs=dict(
                    pdf_paths="params:pdf_paths",
                    pdf_metadata_map="params:pdf_metadata_map",
                    embedding_model_name="params:embedding_model_name",
                    chunk_size="params:chunk_size",
                    chunk_overlap="params:chunk_overlap",
                    separators="params:separators",
                    suspicious_patterns="params:suspicious_patterns"
                ),
                outputs="chunks",
                name="parsing_node",
            ),
            node(
                create_faiss_vectorstore_from_chunks,
                inputs=dict(
                    chunks="chunks",
                    embedding_model_name="params:embedding_model_name",
                ),
                outputs="vectorstore",
                name="embedding_node",
            ),
        ]
    )
