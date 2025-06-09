"""Project pipelines."""

from kedro.pipeline import Pipeline

from rag.pipelines.embedding.pipeline import create_embedding_pipeline


def register_pipelines() -> dict[str, Pipeline]:
    """Register the project's pipelines.

    Returns:
        A mapping from pipeline names to ``Pipeline`` objects.
    """

    embedding_pipeline = create_embedding_pipeline()
    return {"embedding": embedding_pipeline}
