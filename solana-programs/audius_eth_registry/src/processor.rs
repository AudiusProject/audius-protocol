//! Program state processor

use crate::error::AudiusError;
use crate::instruction::{AudiusInstruction, SignatureData};
use crate::state::{SecpSignatureOffsets, SignerGroup, ValidSigner};
use borsh::{BorshDeserialize, BorshSerialize};
use num_traits::FromPrimitive;
use solana_program::decode_error::DecodeError;
use solana_program::program_error::PrintProgramError;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    sysvar,
};

/// Program state handler
pub struct Processor {}
impl Processor {
    /// SignerGroup version indicating group initialization
    pub const SIGNER_GROUP_VERSION: u8 = 1;

    /// ValidSigner version indicating signer initialization
    pub const VALID_SIGNER_VERSION: u8 = 1;

    /// ValidSigner version indicating signer uninitialization
    pub const VALID_SIGNER_UNINITIALIZED_VERSION: u8 = 0;

    /// Process [InitSignerGroup]().
    pub fn process_init_signer_group(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // signer group owner account
        let group_owner_info = next_account_info(account_info_iter)?;

        let mut signer_group = Box::new(SignerGroup::try_from_slice(
            &signer_group_info.data.borrow(),
        )?);

        if signer_group.is_initialized() {
            return Err(AudiusError::SignerGroupAlreadyInitialized.into());
        }

        signer_group.version = Self::SIGNER_GROUP_VERSION;
        signer_group.owner = *group_owner_info.key;

        signer_group
            .serialize(&mut *signer_group_info.data.borrow_mut())
            .map_err(|e| e.into())
    }

    /// Process [InitValidSigner]().
    pub fn process_init_valid_signer(
        accounts: &[AccountInfo],
        eth_address: [u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE],
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // uninitialized valid signer account
        let valid_signer_info = next_account_info(account_info_iter)?;
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // signer group's owner
        let signer_groups_owner_info = next_account_info(account_info_iter)?;

        let signer_group = Box::new(SignerGroup::try_from_slice(
            &signer_group_info.data.borrow(),
        )?);

        if !signer_group.is_initialized() {
            return Err(AudiusError::UninitializedSignerGroup.into());
        }

        let mut valid_signer = Box::new(ValidSigner::try_from_slice(
            &valid_signer_info.data.borrow(),
        )?);

        if valid_signer.is_initialized() {
            return Err(AudiusError::SignerAlreadyInitialized.into());
        }

        signer_group.check_owner(&signer_groups_owner_info)?;
    }

    pub fn process_init_valid_signer_from_signer(
        accounts: &[AccountInfo],
        eth_address: [u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE],
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // uninitialized valid signer account
        let valid_signer_info = next_account_info(account_info_iter)?;
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // initialized valid signer account
        let existing_valid_signer_info = next_account_info(account_info_iter)?;

        let existing_valid_signer = Box::new(ValidSigner::try_from_slice(
            &existing_valid_signer_info.data.borrow(),
        )?);

        if !existing_valid_signer.is_initialized() {
            return Err(AudiusError::ValidSignerNotInitialized.into());
        }

        let mut valid_signer = Box::new(ValidSigner::try_from_slice(
            &valid_signer_info.data.borrow(),
        )?);

        if valid_signer.is_initialized() {
            return Err(AudiusError::SignerAlreadyInitialized.into());
        }

        if existing_valid_signer.signer_group != *signer_group_info.key {
            return Err(AudiusError::WrongSignerGroup.into());
        }

        if !existing_valid_signer_info.is_signer {
            return Err(AudiusError::SignatureMissing.into());
        }

        // TODO: check if ethereum public key is valid

        valid_signer.version = Self::VALID_SIGNER_VERSION;
        valid_signer.signer_group = *signer_group_info.key;
        valid_signer.eth_address = eth_address;

        valid_signer
            .serialize(&mut *valid_signer_info.data.borrow_mut())
            .map_err(|e| e.into())
    }

    /// Process [ClearValidSigner]().
    pub fn process_clear_valid_signer(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // initialized valid signer account
        let valid_signer_info = next_account_info(account_info_iter)?;
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // signer group's owner
        let signer_groups_owner_info = next_account_info(account_info_iter)?;

        let signer_group = Box::new(SignerGroup::try_from_slice(
            &signer_group_info.data.borrow(),
        )?);

        if !signer_group.is_initialized() {
            return Err(AudiusError::UninitializedSignerGroup.into());
        }

        let mut valid_signer = Box::new(ValidSigner::try_from_slice(
            &valid_signer_info.data.borrow(),
        )?);

        if !valid_signer.is_initialized() {
            return Err(AudiusError::ValidSignerNotInitialized.into());
        }

        if valid_signer.signer_group != *signer_group_info.key {
            return Err(AudiusError::WrongSignerGroup.into());
        }

        signer_group.check_owner(&signer_groups_owner_info)?;

        valid_signer.version = Self::VALID_SIGNER_UNINITIALIZED_VERSION;

        valid_signer
            .serialize(&mut *valid_signer_info.data.borrow_mut())
            .map_err(|e| e.into())
    }

    /// Process [ValidateSignature]().
    pub fn process_validate_signature(
        accounts: &[AccountInfo],
        signature_data: SignatureData,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // initialized valid signer account
        let valid_signer_info = next_account_info(account_info_iter)?;
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // Sysvar Instruction account info
        let instruction_info = next_account_info(account_info_iter)?;
        // Index of current instruction in tx
        let index = sysvar::instructions::load_current_index(&instruction_info.data.borrow());

        if index == 0 {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }

        // Instruction data of Secp256 program call
        let secp_instruction = sysvar::instructions::load_instruction_at(
            (index - 1) as usize,
            &instruction_info.data.borrow(),
        )
        .unwrap();

        let signer_group = Box::new(SignerGroup::try_from_slice(
            &signer_group_info.data.borrow(),
        )?);

        if !signer_group.is_initialized() {
            return Err(AudiusError::UninitializedSignerGroup.into());
        }

        let valid_signer = Box::new(ValidSigner::try_from_slice(
            &valid_signer_info.data.borrow(),
        )?);

        if !valid_signer.is_initialized() {
            return Err(AudiusError::ValidSignerNotInitialized.into());
        }

        if valid_signer.signer_group != *signer_group_info.key {
            return Err(AudiusError::WrongSignerGroup.into());
        }

        let mut instruction_data = vec![];
        let data_start = 1 + SecpSignatureOffsets::SIGNATURE_OFFSETS_SERIALIZED_SIZE;
        instruction_data.resize(
            data_start
                + SecpSignatureOffsets::ETH_ADDRESS_SIZE
                + SecpSignatureOffsets::SECP_SIGNATURE_SIZE
                + signature_data.message.len()
                + 1,
            0,
        );
        let eth_address_offset = data_start;
        instruction_data
            [eth_address_offset..eth_address_offset + SecpSignatureOffsets::ETH_ADDRESS_SIZE]
            .copy_from_slice(&valid_signer.eth_address);

        let signature_offset = data_start + SecpSignatureOffsets::ETH_ADDRESS_SIZE;
        instruction_data
            [signature_offset..signature_offset + SecpSignatureOffsets::SECP_SIGNATURE_SIZE]
            .copy_from_slice(&signature_data.signature);

        instruction_data[signature_offset + SecpSignatureOffsets::SECP_SIGNATURE_SIZE] =
            signature_data.recovery_id;

        let message_data_offset = signature_offset + SecpSignatureOffsets::SECP_SIGNATURE_SIZE + 1;
        instruction_data[message_data_offset..].copy_from_slice(&signature_data.message);

        let num_signatures = 1;
        instruction_data[0] = num_signatures;
        let offsets = SecpSignatureOffsets {
            signature_offset: signature_offset as u16,
            signature_instruction_index: 0,
            eth_address_offset: eth_address_offset as u16,
            eth_address_instruction_index: 0,
            message_data_offset: message_data_offset as u16,
            message_data_size: signature_data.message.len() as u16,
            message_instruction_index: 0,
        };
        let packed_offsets = offsets.try_to_vec()?;
        instruction_data[1..data_start].copy_from_slice(packed_offsets.as_slice());

        if instruction_data != secp_instruction.data {
            return Err(AudiusError::SignatureVerificationFailed.into());
        }

        Ok(())
    }

    /// Process an [Instruction]().
    pub fn process(_program_id: &Pubkey, accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
        let instruction = AudiusInstruction::try_from_slice(input)?;

        match instruction {
            AudiusInstruction::InitSignerGroup => {
                msg!("Instruction: InitSignerGroup");
                Self::process_init_signer_group(accounts)
            }
            AudiusInstruction::InitValidSigner(eth_pubkey) => {
                msg!("Instruction: InitValidSigner");
                Self::process_init_valid_signer(accounts, eth_pubkey)
            }
            AudiusInstruction::InitValidSignerFromSigner(eth_pubkey) => {
                msg!("Instruction: InitValidSignerFromSigner");
                Self::process_init_valid_signer_from_signer(accounts, eth_pubkey)
            }
            AudiusInstruction::ClearValidSigner => {
                msg!("Instruction: ClearValidSigner");
                Self::process_clear_valid_signer(accounts)
            }
            AudiusInstruction::ValidateSignature(signature) => {
                msg!("Instruction: ValidateSignature");
                Self::process_validate_signature(accounts, signature)
            }
        }
    }
}

impl PrintProgramError for AudiusError {
    fn print<E>(&self)
    where
        E: 'static + std::error::Error + DecodeError<E> + PrintProgramError + FromPrimitive,
    {
        match self {
            AudiusError::InvalidInstruction => msg!("Invalid instruction"),
            AudiusError::SignerGroupAlreadyInitialized => msg!("Signer group already initialized"),
            AudiusError::UninitializedSignerGroup => msg!("Uninitialized signer group"),
            AudiusError::SignerAlreadyInitialized => msg!("Signer is already initialized"),
            AudiusError::ValidSignerNotInitialized => msg!("Valid signer isn't initialized"),
            AudiusError::WrongSignerGroup => msg!("Signer doesnt belong to this group"),
            AudiusError::WrongOwner => msg!("Wrong owner"),
            AudiusError::SignatureMissing => msg!("Signature missing"),
            AudiusError::SignatureVerificationFailed => msg!("Signature verification failed"),
            AudiusError::Secp256InstructionLosing => msg!("Secp256 instruction losing"),
        }
    }
}
