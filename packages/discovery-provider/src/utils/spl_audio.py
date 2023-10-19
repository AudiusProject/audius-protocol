# Sol balances have 8 decimals, so they need to be increased to 18 to match eth balances
from typing import Union

SPL_TO_WEI = 10**10
SPL_TO_WEI_PADDING = "0" * 10

LAMPORTS_PER_SOL = 10**8


def to_wei(balance: Union[int, str]):
    return int(balance) * SPL_TO_WEI if balance else 0


def to_wei_string(spl_amount: Union[int, str]):
    return f"{spl_amount}{SPL_TO_WEI_PADDING}"


def from_lamports(spl_amount: str):
    return int(spl_amount) / LAMPORTS_PER_SOL if spl_amount else 0
