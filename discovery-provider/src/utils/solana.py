import base58
from solana.publickey import PublicKey

def get_address_pair(mint, hashed_eth_pk, program_id, spl_token_id):
    base_pk, base_seed = get_base_address(mint, program_id)
    derived_pk, derive_seed = get_derived_address(base_pk, hashed_eth_pk, spl_token_id)
    return [(base_pk, base_seed), (derived_pk, derive_seed)]


def get_base_address(mint, program_id):
    return PublicKey.find_program_address([bytes(mint)], program_id)


def get_derived_address(base, hashed_eth_pk, spl_token_id):
    seed = base58.b58encode(hashed_eth_pk).decode()
    return PublicKey.create_with_seed(base, seed, spl_token_id), seed
