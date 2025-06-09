import logging

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
