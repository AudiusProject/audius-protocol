import re
import base58
import websockets
import solana
import asyncio

from solana.account import Account
from solana.publickey import PublicKey
from solana.rpc.api import Client
from spl.token.client import Token


web_socket_endpoint = "wss://audius.rpcpool.com/"

solana_client = Client("https://audius.rpcpool.com")

TEST_USER_BANK_PROGRAM = PublicKey("AVys2x8dfgTDLuGLh67Q1uYXixEsyqBhGDQ9fYV39Y9f")
WAUDIO_PROGRAM_ID = PublicKey("CYzPVv1zB9RH6hRWRKprFoepdD8Y7Q5HefCqrybvetja")
WAUDIO_MINT_PUBKEY = PublicKey("9zyPU1mjgzaVyQsYwKJJ7AhVz5bgx5uc1NPABvAcUXsT")
SPL_TOKEN_ID = PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")

waudio_token = Token(
    conn=solana_client,
    pubkey=WAUDIO_MINT_PUBKEY,
    program_id=WAUDIO_PROGRAM_ID,
    payer=[],  # not making any txs so payer is not required
)

MAX_SLOT = 84150237

signatures = solana_client.get_confirmed_signature_for_address2(TEST_USER_BANK_PROGRAM, limit=10)

def get_address_pair(mint, hashed_eth_pk, program_id, spl_token_id):
    base_pk, base_seed = get_base_address(mint, program_id)
    derived_pk, derive_seed = get_derived_address(base_pk, hashed_eth_pk, spl_token_id)
    return [(base_pk, base_seed), (derived_pk, derive_seed)]


def get_base_address(mint, program_id):
    return PublicKey.find_program_address([bytes(mint)], program_id)


def get_derived_address(base, hashed_eth_pk, spl_token_id):
    seed = base58.b58encode(hashed_eth_pk).decode()
    return PublicKey.create_with_seed(base, seed, spl_token_id), seed

# # Create account TX = https://explorer.solana.com/tx/36Y427jtExbbPB8xAnqQCwRy47pcUWs6RJVt6vjEEKpGvaUtzQAhaGce5EnudMeR3P8p6Agp1FJfsDNGyGcVgrCf

history = signatures['result']
for tx_info in history:
    sig = tx_info['signature']
    if tx_info['slot'] < MAX_SLOT:
        break
    details = solana_client.get_confirmed_transaction(sig)
    # print(sig)
    # print(details)
    meta = details['result']['meta']
    account_keys = details['result']['transaction']['message']['accountKeys']
    instructions = meta['logMessages']
    for msg in instructions:
        # Log messages formatted like this
        # EthereumAddress = [230, 172, 242, 137, 206, 234, 14, 250, 0, 244, 33, 113, 84, 94, 181, 223, 172, 181, 162, 161]
        if 'EthereumAddress' in msg:
            res = re.findall(r'\[.*?\]', msg)
             # Remove brackets
            inner_res = res[0][1:-1]
            # Convert to public key hex for ethereum
            arr_val = [int(s) for s in inner_res.split(',')]
            public_key_bytes = bytes(arr_val)
            public_key = public_key_bytes.hex()
            public_key_str = f"0x{public_key}"
            print(public_key_str)
            # Re-derive address
            base_address, derived_address = get_address_pair(
                WAUDIO_PROGRAM_ID,
                public_key_bytes,
                TEST_USER_BANK_PROGRAM,
                SPL_TOKEN_ID
            )
            bank_acct = str(derived_address[0])
            print(str(bank_acct))
            print(account_keys)
            # print(account_keys.index(str(bank_acct)))
            try:
                bank_acct_index = account_keys.index(bank_acct)
                if bank_acct_index:
                    print(f"Found known account: {public_key_str}, {bank_acct}")
            except ValueError as e:
                print(e)

            # if bank_acct in account_keys:
            #     print(f"{public_key_str} - {bank_acct} Account generated!")

            # for acct in account_keys:
            #     print(f"{bank_acct} | {acct}, {len(bank_acct)} | {len(acct)}")
            #     print(bank_acct == acct)
    print('---')

raw_pk = bytes([230, 172, 242, 137, 206, 234, 14, 250, 0, 244, 33, 113, 84, 94, 181, 223, 172, 181, 162, 161])
print(raw_pk)
print(raw_pk.hex()) # matches e6acf289ceea0efa00f42171545eb5dfacb5a2a1

'''
web-server_1             | e6acf289ceea0efa00f42171545eb5dfacb5a2a1
web-server_1             | e6acf289ceea0efa00f42171545eb5dfacb5a2a1:(BWrNBH8jpryFKSgHF3XP8iGBrfRUFFoD26yUr39NFcc, 255),(538W4ufP2p5vw3HJ651deZJKGMxC1s5Wk1H99Z2uKQrS, '4DPt94T5HG6yvUMvTizuJjuReWN4')



print("token program id:", WAUDIO_PROGRAM_ID)
print("token mint pk:", WAUDIO_MINT_PUBKEY)

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

hashed_eth_pk = bytes.fromhex("afa0d5fa097681aabcf5fa2a8d2ff6a818da851c")
base_address, derived_address = get_address_pair(
    WAUDIO_PROGRAM_ID,
    hashed_eth_pk,
    TEST_USER_BANK_PROGRAM,
    spl_token_id
)
# 0xd5c34c34e4e599463ad9b04aa584c5bd8d4e13dd
# To - AztFuTo9DYASUqR2qSHLbMNcCsst3n2nbZxeYTdKpb1Q
print("base address (pubkey, seed):", base_address)
print("derived address (pubkey, seed):", derived_address)
print("expected: AztFuTo9DYASUqR2qSHLbMNcCsst3n2nbZxeYTdKpb1Q")

# 0xb37cad7de55280aeffd30ae0c50785f1fdc20c8c
base_address_2, derived_address_2 = get_address_pair(
    WAUDIO_PROGRAM_ID,
    bytes.fromhex("b37cad7de55280aeffd30ae0c50785f1fdc20c8c"),
    TEST_USER_BANK_PROGRAM,
    spl_token_id
)

print("base address (pubkey, seed):", base_address_2)
print("derived address (pubkey, seed):", derived_address_2)
print("expected: CtMXFhqNEmB4LbStB27LU6VqSqGJj5UZzeKojEr6xvC9")
'''