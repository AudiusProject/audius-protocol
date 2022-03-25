from anchorpy import Provider

AUDIUS_DATA_PROGRAM_PATH = "../../solana-programs/anchor/audius-data"
AUDIUS_DATA_IDL_PATH = f"{AUDIUS_DATA_PROGRAM_PATH}/target/idl/audius_data.json"
PROVIDER = Provider.local()  # testing
RPC_ADDRESS = "http://localhost:8899"
AUDIUS_DATA_PROGRAM_NAME = "audius_data"
