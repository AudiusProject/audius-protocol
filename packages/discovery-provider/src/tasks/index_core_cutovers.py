from src.utils.config import shared_config

env = shared_config["discprov"]["env"]

# dev plays
DEV_PLAYS_SOL_CUTOVER = 0
DEV_PLAYS_CORE_CUTOVER = 0

# stage plays
STAGE_PLAYS_SOL_CUTOVER = 309415000
STAGE_PLAYS_CORE_CUTOVER = 10000


# returns the core_block plus the last sol slot so indexing
# keeps a consistent block number
def get_adjusted_core_block(core_block: int) -> int:
    return get_sol_cutover() + core_block


def get_sol_cutover() -> int:
    if env == "dev":
        return DEV_PLAYS_SOL_CUTOVER
    if env == "stage":
        return STAGE_PLAYS_SOL_CUTOVER
    return 0


def get_core_cutover() -> int:
    if env == "dev":
        return DEV_PLAYS_CORE_CUTOVER
    if env == "stage":
        return STAGE_PLAYS_CORE_CUTOVER
    return 0
