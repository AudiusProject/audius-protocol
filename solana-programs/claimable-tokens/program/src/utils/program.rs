#![allow(missing_docs)]

//! Extended functionality for Pubkey
use solana_program::{pubkey::Pubkey, pubkey::PubkeyError};

/// Represent Ethereum pubkey bytes
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

/// Base with corresponding derived address
pub struct AddressPair {
    pub base: Base,
    pub derive: Derived,
}

/// Sender nonce account seed
pub const NONCE_ACCOUNT_PREFIX: &str = "N_";

/// Finds a program address, using first 32 bytes of `pubkey` + `seed` as seed, and
/// `base` as base
pub fn find_program_address_with_seed(
    program_id: &Pubkey,
    base: &Pubkey,
    seed: &[u8],
) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[&base.to_bytes()[..32], seed], program_id)
}

/// Finds a program address, using nonce account as seed
/// 'base'
pub fn find_nonce_address(
    program_id: &Pubkey,
    mint: &Pubkey,
    nonce_acct_seed: &[u8]
) -> (Pubkey, Pubkey, u8) {
    // Check that the incremented nonce provided matches expected value
    // Generating base address for nonce acct from mint
    let (base_pubkey, _) = find_base_address(mint, program_id);

    let (derived_address, bump_seed) =
        find_program_address_with_seed(program_id, &base_pubkey, &nonce_acct_seed);

    return (base_pubkey, derived_address, bump_seed)
}

/// Return `Base` account with seed and corresponding derived address
/// with seed
pub fn find_address_pair(
    program_id: &Pubkey,
    mint: &Pubkey,
    eth_public_key: EthereumAddress,
) -> Result<AddressPair, PubkeyError> {
    let (base_pubkey, base_seed) = find_base_address(mint, program_id);
    let (derived_pubkey, derive_seed) = find_derived_address(&base_pubkey.clone(), eth_public_key)?;
    Ok(AddressPair {
        base: Base {
            address: base_pubkey,
            seed: base_seed,
        },
        derive: Derived {
            address: derived_pubkey,
            seed: derive_seed,
        },
    })
}

/// Return PDA(that named `Base`) corresponding to specific mint
/// and it bump seed
pub fn find_base_address(mint: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[&mint.to_bytes()[..32]], program_id)
}

/// Return derived token account address corresponding to specific
/// ethereum account and seed
pub fn find_derived_address(
    base: &Pubkey,
    eth_public_key: EthereumAddress,
) -> Result<(Pubkey, String), PubkeyError> {
    let seed = bs58::encode(eth_public_key).into_string();
    Pubkey::create_with_seed(base, seed.as_str(), &spl_token::id()).map(|i| (i, seed))
}
