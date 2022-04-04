use super::UNINITIALIZED_VERSION;
use crate::PROGRAM_VERSION;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

/// Reward manager
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone)]
pub struct RewardManager {
    /// Version
    pub version: u8,
    /// Token account for rewards to be sent via this program
    pub token_account: Pubkey,
    /// Account authorized managing this Reward Manager (adding/removing signers, updating params etc.)
    pub manager: Pubkey,
    /// Number of signer votes required for sending rewards
    pub min_votes: u8,
}

impl RewardManager {
    /// Creates new `RewardManager`
    pub fn new(token_account: Pubkey, manager: Pubkey, min_votes: u8) -> Self {
        Self {
            version: PROGRAM_VERSION,
            token_account,
            manager,
            min_votes,
        }
    }
}

impl Sealed for RewardManager {}
impl Pack for RewardManager {
    // 1 + 32 + 32 + 1
    const LEN: usize = 66;

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let mut slice = dst;
        self.serialize(&mut slice).unwrap()
    }

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        Self::try_from_slice(src).map_err(|err| {
            msg!("Failed to deserialize");
            msg!(&err.to_string());
            ProgramError::InvalidAccountData
        })
    }
}

impl IsInitialized for RewardManager {
    fn is_initialized(&self) -> bool {
        self.version != UNINITIALIZED_VERSION
    }
}
