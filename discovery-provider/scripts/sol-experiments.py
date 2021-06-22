import base58
import solana
from solana.account import Account
from solana.publickey import PublicKey
from solana.rpc.api import Client
from spl.token.client import Token

solana_client = Client("https://audius.rpcpool.com")


def get_address_pair(mint, hashed_eth_pk, program_id, spl_token_id):
    base_pk, base_seed = get_base_address(mint, program_id)
    derived_pk, derive_seed = get_derived_address(base_pk, hashed_eth_pk, spl_token_id)
    return [(base_pk, base_seed), (derived_pk, derive_seed)]


def get_base_address(mint, program_id):
    return PublicKey.find_program_address([bytes(mint)], program_id)


def get_derived_address(base, hashed_eth_pk, spl_token_id):
    seed = base58.b58encode(hashed_eth_pk).decode()
    return PublicKey.create_with_seed(base, seed, spl_token_id), seed


TEST_USER_BANK_PROGRAM = PublicKey("8a3KEEEXgWyeJcZr4G5Y8r19TdriEMziBSi2qSEJxT6z")
WAUDIO_PROGRAM_ID = PublicKey("CYzPVv1zB9RH6hRWRKprFoepdD8Y7Q5HefCqrybvetja")
WAUDIO_MINT_PUBKEY = PublicKey("9zyPU1mjgzaVyQsYwKJJ7AhVz5bgx5uc1NPABvAcUXsT")

print("token program id:", WAUDIO_PROGRAM_ID)
print("token mint pk:", WAUDIO_MINT_PUBKEY)

waudio_token = Token(
    conn=solana_client,
    pubkey=WAUDIO_MINT_PUBKEY,
    program_id=WAUDIO_PROGRAM_ID,
    payer=[],  # not making any txs so payer is not required
)

"""
Querying this balance:
https://explorer.solana.com/address/Huc3gaSwGQ74nyjHoKYnJwNijcobecQq4KiuL1tdgtNZ
"""
print(
    waudio_token.get_balance(PublicKey("Huc3gaSwGQ74nyjHoKYnJwNijcobecQq4KiuL1tdgtNZ"))
)

"""
eth_pubkey = c9D4B5727f7098F45ceF4AbfBc67bA53a714c247
https://explorer.solana.com/address/E3Q1yeMU3LndGmcPD9msjzbBZEyb8JGtw7CBEwKcGL5g
"""
print(
    waudio_token.get_balance(PublicKey("E3Q1yeMU3LndGmcPD9msjzbBZEyb8JGtw7CBEwKcGL5g"))
)

hashed_eth_pk = bytes.fromhex("c9D4B5727f7098F45ceF4AbfBc67bA53a714c247")
spl_token_id = PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
base_address, derived_address = get_address_pair(
    WAUDIO_PROGRAM_ID, hashed_eth_pk, TEST_USER_BANK_PROGRAM, spl_token_id
)
print("base address (pubkey, seed):", base_address)
print("derived address (pubkey, seed):", derived_address)
