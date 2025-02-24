from src.utils.config import shared_config

env = shared_config["discprov"]["env"]

# dev plays
DEV_PLAYS_SOL_CUTOVER = 0
DEV_PLAYS_CORE_CUTOVER = 1
DEV_PLAYS_CORE_CUTOVER_CHAIN_ID = "audius-devnet"

# stage plays
STAGE_PLAYS_SOL_CUTOVER = 309415000
STAGE_PLAYS_CORE_CUTOVER = 10000
STAGE_PLAYS_CORE_CUTOVER_CHAIN_ID = "audius-testnet-17"

# prod plays
PROD_PLAYS_SOL_CUTOVER = 315925000
PROD_PLAYS_CORE_CUTOVER = 113180
PROD_PLAYS_CORE_CUTOVER_CHAIN_ID = "audius-mainnet-alpha"

# dev em
DEV_EM_ACDC_CUTOVER = 0
DEV_EM_CORE_CUTOVER = 1
DEV_EM_CORE_CUTOVER_CHAIN_ID = "audius-devnet"

# stage em
STAGE_EM_ACDC_CUTOVER = 95624000
STAGE_EM_CORE_CUTOVER = 3615000
STAGE_EM_CORE_CUTOVER_CHAIN_ID = "audius-testnet-19"

# prod em
PROD_EM_ACDC_CUTOVER = -1
PROD_EM_CORE_CUTOVER = -1
PROD_EM_CORE_CUTOVER_CHAIN_ID = "audius-mainnet-alpha"


def get_plays_core_cutover_chain_id() -> str:
    if env == "dev":
        return DEV_PLAYS_CORE_CUTOVER_CHAIN_ID
    if env == "stage":
        return STAGE_PLAYS_CORE_CUTOVER_CHAIN_ID
    return PROD_PLAYS_CORE_CUTOVER_CHAIN_ID


def get_sol_cutover() -> int:
    if env == "dev":
        return DEV_PLAYS_SOL_CUTOVER
    if env == "stage":
        return STAGE_PLAYS_SOL_CUTOVER
    return PROD_PLAYS_SOL_CUTOVER


def get_plays_core_cutover() -> int:
    if env == "dev":
        return DEV_PLAYS_CORE_CUTOVER
    if env == "stage":
        return STAGE_PLAYS_CORE_CUTOVER
    return PROD_PLAYS_CORE_CUTOVER


def get_em_core_cutovers_chain_id() -> str:
    if env == "dev":
        return DEV_EM_CORE_CUTOVER_CHAIN_ID
    if env == "stage":
        return STAGE_EM_CORE_CUTOVER_CHAIN_ID
    return PROD_EM_CORE_CUTOVER_CHAIN_ID


def get_em_cutover() -> int:
    if env == "dev":
        return DEV_EM_ACDC_CUTOVER
    if env == "stage":
        return STAGE_EM_ACDC_CUTOVER
    return PROD_EM_ACDC_CUTOVER


def get_em_core_cutover() -> int:
    if env == "dev":
        return DEV_EM_CORE_CUTOVER
    if env == "stage":
        return STAGE_EM_CORE_CUTOVER
    return PROD_EM_CORE_CUTOVER
