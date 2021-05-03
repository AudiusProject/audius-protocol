//! State transition types

use crate::error::AudiusError;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey};
use std::mem::size_of;

/// Signer group data
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq, BorshDeserialize, BorshSerialize)]
pub struct SignerGroup {
    /// Groups version
    pub version: u8,
    /// Pubkey of the account authorized to add/remove valid signers
    pub owner: Pubkey,
}

/// Valid signer data
#[repr(C)]
#[derive(Clone, Debug, Default, PartialEq, BorshDeserialize, BorshSerialize)]
pub struct ValidSigner {
    /// Signer version
    pub version: u8,
    /// SignerGroup this ValidSigner belongs to
    pub signer_group: Pubkey,
    /// Ethereum address of signer
    pub eth_address: [u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE],
}

/// Secp256k1 signature offsets data
#[derive(Clone, Copy, Debug, Default, PartialEq, BorshDeserialize, BorshSerialize)]
pub struct SecpSignatureOffsets {
    /// Offset of 64+1 bytes
    pub signature_offset: u16,
    /// Index of signature instruction in buffer
    pub signature_instruction_index: u8,
    /// Offset to eth_address of 20 bytes
    pub eth_address_offset: u16,
    /// Index of eth address instruction in buffer
    pub eth_address_instruction_index: u8,
    /// Offset to start of message data
    pub message_data_offset: u16,
    /// Size of message data
    pub message_data_size: u16,
    /// Index on message instruction in buffer
    pub message_instruction_index: u8,
}

impl SignerGroup {
    /// Length of SignerGroup when serialized
    pub const LEN: usize = size_of::<SignerGroup>();

    /// Check if SignerGroup is initialized
    pub fn is_initialized(&self) -> bool {
        self.version != 0
    }

    /// Check owner validity and signature
    pub fn check_owner(&self, owner_info: &AccountInfo) -> Result<(), ProgramError> {
        if *owner_info.key != self.owner {
            return Err(AudiusError::WrongOwner.into());
        }
        if !owner_info.is_signer {
            return Err(AudiusError::SignatureMissing.into());
        }
        Ok(())
    }
}

impl ValidSigner {
    /// Length of ValidSigner when serialized
    pub const LEN: usize = size_of::<ValidSigner>();

    /// Check if ValidSigner is initialized
    pub fn is_initialized(&self) -> bool {
        self.version != 0
    }
}

impl SecpSignatureOffsets {
    /// Max value can be hold in one byte
    pub const MAX_VALUE_ONE_BYTE: u16 = 256;

    /// Size of serialized Secp256k1 signature
    pub const SIGNATURE_OFFSETS_SERIALIZED_SIZE: usize = 11;

    /// Size of Secp256k1 signature
    pub const SECP_SIGNATURE_SIZE: usize = 64;

    /// Ethereum public key size
    pub const ETH_ADDRESS_SIZE: usize = 20;
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_signer_group() {
        let signer_group = SignerGroup {
            version: 0,
            owner: Pubkey::new_from_array([1; 32]),
        };

        let packed = signer_group.try_to_vec().unwrap();

        let unpacked = SignerGroup::try_from_slice(packed.as_slice()).unwrap();

        assert_eq!(signer_group, unpacked);

        assert_eq!(signer_group.is_initialized(), false);
    }

    #[test]
    fn test_valid_signer() {
        let valid_signer = ValidSigner {
            version: 1,
            signer_group: Pubkey::new_from_array([1; 32]),
            eth_address: [7; SecpSignatureOffsets::ETH_ADDRESS_SIZE],
        };

        let packed = valid_signer.try_to_vec().unwrap();

        let unpacked = ValidSigner::try_from_slice(packed.as_slice()).unwrap();

        assert_eq!(valid_signer, unpacked);

        assert_eq!(valid_signer.is_initialized(), true);
    }

    #[test]
    fn test_offsets_pack_unpack() {
        let offsets = SecpSignatureOffsets {
            signature_offset: 345,
            signature_instruction_index: 43,
            eth_address_offset: 278,
            eth_address_instruction_index: 7,
            message_data_offset: 783,
            message_data_size: 543,
            message_instruction_index: 10,
        };

        let packed = offsets.try_to_vec().unwrap();

        let unpacked = SecpSignatureOffsets::try_from_slice(packed.as_slice()).unwrap();

        assert_eq!(offsets, unpacked);
    }
}
