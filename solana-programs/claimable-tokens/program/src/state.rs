//! State transition types
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

/// Transfer instruction data
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct TransferInstructionData {
    /// Transfer target pub key
    pub target_pubkey: Pubkey,
    /// Amount to transfer
    pub amount: u64,
    /// User level nonce
    pub nonce: u64,
}