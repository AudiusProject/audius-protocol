# Sol balances have 8 decimals, so they need to be increased to 18 to match eth balances
from typing import Union

SPL_TO_WEI = 10 ** 10


def to_wei(balance: Union[int, str]):
    return int(balance) * SPL_TO_WEI if balance else 0
