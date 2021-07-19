#![allow(missing_docs)]

//! Extended functionality for Pubkey
use solana_program::pubkey::{Pubkey, PubkeyError};

/// Represent compressed ethereum pubkey
pub type EthereumAddress = [u8; 20];

/// Base PDA related with some mint
pub struct Base {
    pub address: Pubkey,
    pub seed: u8,
}

/// Derived account related with some Base and Ethereum address
pub struct Derived {
    pub address: Pubkey,
    pub seed: String,
}

/// Base with related
pub struct AddressPair {
    pub base: Base,
    pub derive: Derived,
}

/// Return `Base` account with seed and corresponding derive
/// with seed
pub fn get_address_pair(
    program_id: &Pubkey,
    mint: &Pubkey,
    hashed_eth_pk: EthereumAddress,
) -> Result<AddressPair, PubkeyError> {
    let (base_pk, base_seed) = get_base_address(mint, program_id);
    let (derived_pk, derive_seed) = get_derived_address(&base_pk.clone(), hashed_eth_pk)?;
    Ok(AddressPair {
        base: Base {
            address: base_pk,
            seed: base_seed,
        },
        derive: Derived {
            address: derived_pk,
            seed: derive_seed,
        },
    })
}

/// Return PDA(that named `Base`) corresponding to specific mint
/// and it bump seed
pub fn get_base_address(mint: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[&mint.to_bytes()[..32]], program_id)
}

/// Return derived token account address corresponding to specific
/// ethereum account and it seed
pub fn get_derived_address(
    base: &Pubkey,
    hashed_eth_pk: EthereumAddress,
) -> Result<(Pubkey, String), PubkeyError> {
    let seed = bs58::encode(hashed_eth_pk).into_string();
    Pubkey::create_with_seed(&base, seed.as_str(), &spl_token::id()).map(|i| (i, seed))
}
