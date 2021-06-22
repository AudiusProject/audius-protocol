import base58
import solana
from solana.account import Account
from solana.publickey import PublicKey
from solana.rpc.api import Client
from spl.token.client import Token

solana_client = Client("https://audius.rpcpool.com")

TEST_USER_BANK_PROGRAM = "8a3KEEEXgWyeJcZr4G5Y8r19TdriEMziBSi2qSEJxT6z"
WAUDIO_PROGRAM_ID = "CYzPVv1zB9RH6hRWRKprFoepdD8Y7Q5HefCqrybvetja"
WAUDIO_MINT_PUBKEY = "9zyPU1mjgzaVyQsYwKJJ7AhVz5bgx5uc1NPABvAcUXsT"

FUNDER_PRIV_KEY = []

"""'
tx_high = '3Hcz3K6QnKBiN5vzHkm5pFs3TwoU39St42ZC3rrio4fiu1oknPjRKVp4cXqCE5e9LE6NaP1FA144znHnM4yPtYaU'

signatures = solana_client.get_confirmed_signature_for_address2(TEST_USER_BANK_PROGRAM, before=tx_high)

# Create account TX = https://explorer.solana.com/tx/36Y427jtExbbPB8xAnqQCwRy47pcUWs6RJVt6vjEEKpGvaUtzQAhaGce5EnudMeR3P8p6Agp1FJfsDNGyGcVgrCf

history = signatures['result']
for tx_info in history:
    sig = tx_info['signature']
    print(tx_info)
    details = solana_client.get_confirmed_transaction(sig)
    print(details)
"""

token_program_key = PublicKey(WAUDIO_PROGRAM_ID)
print(token_program_key)

token_mint_key = PublicKey(WAUDIO_MINT_PUBKEY)
print(token_mint_key)

funder_account = Account(FUNDER_PRIV_KEY[:32])
print(funder_account.public_key())

waudio_token = Token(
    conn=solana_client,
    pubkey=token_mint_key,
    program_id=token_program_key,
    payer=funder_account,
)
# print(waudio_token)

"""
Querying this balance:
https://explorer.solana.com/address/Huc3gaSwGQ74nyjHoKYnJwNijcobecQq4KiuL1tdgtNZ
"""

bal_obj = waudio_token.get_balance(
    PublicKey("Huc3gaSwGQ74nyjHoKYnJwNijcobecQq4KiuL1tdgtNZ")
)
print(
    waudio_token.get_balance(PublicKey("Huc3gaSwGQ74nyjHoKYnJwNijcobecQq4KiuL1tdgtNZ"))
)

"""
eth_pubkey = c9D4B5727f7098F45ceF4AbfBc67bA53a714c247
https://explorer.solana.com/address/E3Q1yeMU3LndGmcPD9msjzbBZEyb8JGtw7CBEwKcGL5g
"""
bal_obj_2 = waudio_token.get_balance(
    PublicKey("E3Q1yeMU3LndGmcPD9msjzbBZEyb8JGtw7CBEwKcGL5g")
)
print(bal_obj_2)


def get_address_pair(mint, hashed_eth_pk, program_id, spl_token_id):
    base_pk, base_seed = get_base_address(mint, program_id)
    derived_pk, derive_seed = get_derived_address(base_pk, hashed_eth_pk, spl_token_id)
    print("derived pk: ", derived_pk)
    return [(base_pk, base_seed), (derived_pk, derive_seed)]


def get_base_address(mint, program_id):
    return PublicKey.find_program_address([bytes(mint)], program_id)


def get_derived_address(base, hashed_eth_pk, spl_token_id):
    seed = base58.b58encode(hashed_eth_pk).decode()
    # seed = "EQn8JQ1deQMHdM9rNztLhxu8zP8vcaxMx85WYRun9WyK"
    print("seed: ", seed)
    return PublicKey.create_with_seed(base, seed, spl_token_id), seed


hashed_eth_pk = bytes.fromhex("c9D4B5727f7098F45ceF4AbfBc67bA53a714c247")
mint = PublicKey(WAUDIO_PROGRAM_ID)
program_id = PublicKey(TEST_USER_BANK_PROGRAM)
spl_token_id = PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
)  # might be "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"


print("base address:", get_base_address(mint, program_id))
print("address pair:", get_address_pair(mint, hashed_eth_pk, program_id, spl_token_id))
