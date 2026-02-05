import json
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src")))

from kedro_boot.app.booter import boot_project
from kedro_boot.framework.compiler.specs import CompilationSpec
from rag.custom_datasets.faiss_vectorstore_dataset import FaissVectorstoreDataset


def main():
    if len(sys.argv) > 1:
        pipeline_name = sys.argv[1]
        inputs = json.loads(sys.argv[2])
        params = json.loads(sys.argv[3])
        vectorstore_path = sys.argv[4]
    else:
        print("No pipeline name given")
        sys.exit(1)
    conf_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../conf"))

    if pipeline_name == "classic_rag":
        inputs["vectorstore"] = FaissVectorstoreDataset(vectorstore_path).load()

    # Boot Kedro project
    session = boot_project(
        project_path="../../kedro_pipelines",
        compilation_specs=[
            CompilationSpec(
                parameters=list(params.keys()),
                inputs=list(inputs.keys()),
            )
        ],
        kedro_args={
            "pipeline": pipeline_name,
            "conf_source": conf_path,
        },
    )

    if pipeline_name == "embedding":
        catalog = session._context.catalog
        catalog.datasets["vectorstore"].update_filepath(vectorstore_path)

    run_results = session.run(parameters=params, inputs=inputs)
    print(json.dumps(run_results))


if __name__ == "__main__":
    main()
