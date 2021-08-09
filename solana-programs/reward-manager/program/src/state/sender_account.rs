use super::UNINITIALIZED_VERSION;
use crate::{utils::EthereumAddress, PROGRAM_VERSION};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

/// Sender account
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone)]
pub struct SenderAccount {
    /// Version
    pub version: u8,
    /// Reward manager
    pub reward_manager: Pubkey,
    /// Ethereum address
    pub eth_address: EthereumAddress,
    /// Sender operator
    pub operator: EthereumAddress,
}

impl SenderAccount {
    /// Creates new `SenderAccount`
    pub fn new(
        reward_manager: Pubkey,
        eth_address: EthereumAddress,
        operator: EthereumAddress,
    ) -> Self {
        Self {
            version: PROGRAM_VERSION,
            reward_manager,
            eth_address,
            operator,
        }
    }
}

impl Sealed for SenderAccount {}
impl Pack for SenderAccount {
    // 1 + 32 + 20 + 20
    const LEN: usize = 73;

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

impl IsInitialized for SenderAccount {
    fn is_initialized(&self) -> bool {
        self.version != UNINITIALIZED_VERSION
    }
}
