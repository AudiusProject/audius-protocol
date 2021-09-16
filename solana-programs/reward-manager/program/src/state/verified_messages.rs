use super::UNINITIALIZED_VERSION;
use crate::{utils::EthereumAddress, PROGRAM_VERSION};
use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::{Pubkey, PUBKEY_BYTES},
};
use std::convert::TryFrom;

/// Vote message
pub type VoteMessage = [u8; 128];

/// Add sender message prefix
pub const ADD_SENDER_MESSAGE_PREFIX: &str = "add";

/// Delete sender message prefix
pub const DELETE_SENDER_MESSAGE_PREFIX: &str = "delete";

/// Generates fixed vote message from slice
#[macro_export]
macro_rules! vote_message {
    ($message:expr) => {{
        let mut new_message = [0; 128];
        new_message[..$message.len()].copy_from_slice(&$message);
        new_message
    }};
}

/// Verified message with operator
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone)]
pub struct VerifiedMessage {
    /// Ethereum address
    pub address: EthereumAddress,
    /// Message
    pub message: VoteMessage,
    /// Operator
    pub operator: EthereumAddress,
}

/// Transient account to store verified messages, created in
/// `submit_attestations`.
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone)]
pub struct VerifiedMessages {
    /// Version
    pub version: u8,
    /// Reward manager
    pub reward_manager: Pubkey,
    /// Messages
    pub messages: Vec<VerifiedMessage>,
}

/// Total verified messages
pub const TOTAL_VERIFIED_MESSAGES: usize = 5;
// 20 + 128 + 20
const VERIFIED_MESSAGE_LEN: usize = 168;
/// Size of verified messages account: 1 + 32 + 1 + (168 * 5)
pub const VERIFIED_MESSAGES_LEN: usize = 874;

impl VerifiedMessages {
    /// Creates new `VerifiedMessages`
    pub fn new(reward_manager: Pubkey) -> Self {
        Self {
            version: PROGRAM_VERSION,
            reward_manager,
            messages: vec![],
        }
    }

    /// Add verified message
    pub fn add(&mut self, message: VerifiedMessage) {
        self.messages.push(message);
    }
}

impl Sealed for VerifiedMessages {}
impl Pack for VerifiedMessages {
    const LEN: usize = VERIFIED_MESSAGES_LEN;

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let output = array_mut_ref![dst, 0, VERIFIED_MESSAGES_LEN];
        #[allow(clippy::ptr_offset_with_cast)]
        let (version, reward_manager, messages_len, data_flat) = mut_array_refs![
            output,
            1,
            PUBKEY_BYTES,
            1,
            VERIFIED_MESSAGE_LEN * TOTAL_VERIFIED_MESSAGES
        ];

        *version = self.version.to_le_bytes();
        reward_manager.copy_from_slice(self.reward_manager.as_ref());
        *messages_len = u8::try_from(self.messages.len()).unwrap().to_le_bytes();

        let mut offset = 0;
        for verified_message in &self.messages {
            let messages_flat = array_mut_ref![data_flat, offset, VERIFIED_MESSAGE_LEN];
            let (address, message, operator) = mut_array_refs![messages_flat, 20, 128, 20];

            address.copy_from_slice(verified_message.address.as_ref());
            message.copy_from_slice(verified_message.message.as_ref());
            operator.copy_from_slice(verified_message.operator.as_ref());

            offset += VERIFIED_MESSAGE_LEN;
        }
    }

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let input = array_ref![src, 0, VERIFIED_MESSAGES_LEN];
        #[allow(clippy::ptr_offset_with_cast)]
        let (version, reward_manager, messages_len, data_flat) = array_refs![
            input,
            1,
            PUBKEY_BYTES,
            1,
            VERIFIED_MESSAGE_LEN * TOTAL_VERIFIED_MESSAGES
        ];

        let version = u8::from_le_bytes(*version);
        let messages_len = u8::from_le_bytes(*messages_len);
        let mut messages = Vec::<VerifiedMessage>::with_capacity(messages_len as usize + 1);

        let mut offset = 0;
        for _ in 0..messages_len {
            let messages_flat = array_ref![data_flat, offset, VERIFIED_MESSAGE_LEN];
            let (address, message, operator) = array_refs![messages_flat, 20, 128, 20];

            messages.push(VerifiedMessage {
                address: *address as EthereumAddress,
                message: *message as VoteMessage,
                operator: *operator as EthereumAddress,
            });

            offset += VERIFIED_MESSAGE_LEN;
        }

        Ok(Self {
            version,
            reward_manager: Pubkey::new_from_array(*reward_manager),
            messages,
        })
    }
}

impl IsInitialized for VerifiedMessages {
    fn is_initialized(&self) -> bool {
        self.version != UNINITIALIZED_VERSION
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;

    /// Version for tests
    pub const TEST_VERSION: u8 = 1;
    /// Pubkey for tests
    pub const TEST_PUBKEY: Pubkey = Pubkey::new_from_array([100; 32]);

    /// VerifiedMessages for tests
    pub const TEST_DATA: VerifiedMessages = VerifiedMessages {
        version: TEST_VERSION,
        reward_manager: TEST_PUBKEY,
        messages: vec![],
    };

    #[test]
    fn serialize_data() {
        let mut expected = vec![TEST_VERSION];
        expected.extend_from_slice(&TEST_PUBKEY.to_bytes());
        expected.extend_from_slice(&[0]);
        expected.extend_from_slice(&[0; 840]);

        println!("{:#?}", expected);
        assert_eq!(
            VerifiedMessages::unpack_unchecked(&expected).unwrap(),
            TEST_DATA
        );
    }
}
