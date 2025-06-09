import logging
import pickle

from kedro.io import AbstractDataset
from langchain_community.vectorstores import FAISS

LOGGER = logging.getLogger(__name__)


class FaissVectorstoreDataset(AbstractDataset):
    def __init__(self, filepath: str):
        """
        Initialize a new instance of FaissVectorstoreDataset for
        loading and saving a FAISS vectorstore.

        Args:
            filepath (str): The location of the vectorstore file.
        """

        self._filepath = filepath

    def _load(self) -> FAISS:
        """Load the FAISS vectorstore from the specified file.

        Returns:
            FAISS: The loaded Langchain FAISS vectorstore object.
        """
        with open(self._filepath, "rb") as f:
            return pickle.load(f)

    def _save(self, database: FAISS):
        """Save the FAISS vectorstore to the specified file.

        Args:
            database (FAISS): The FAISS vectorstore object to save.
        """
        with open(self._filepath, "wb") as f:
            pickle.dump(database, f)
            LOGGER.info(f"Vector database successfully saved to {self._filepath}")

    def _describe(self) -> dict[str, any]:
        """Return a dictionary describing the dataset attributes.

        Returns:
            dict[str, any]: A dictionary with dataset attributes.
        """
        return dict(filepath=self._filepath)
