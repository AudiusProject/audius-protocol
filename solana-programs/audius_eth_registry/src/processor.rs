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

    /// Process [recover instruction data]().
    pub fn recover_instruction_data(
        signature_data: &SignatureData,
        valid_signer: &ValidSigner
    ) -> Vec<u8> {
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

        let packed_offsets = offsets.try_to_vec();
        instruction_data[1..data_start].copy_from_slice(&packed_offsets.unwrap());

        return instruction_data;
    }

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

        signer_group.owner_enabled = true;

        signer_group
            .serialize(&mut *signer_group_info.data.borrow_mut())
            .map_err(|e| e.into())
    }

    /// Process [DisableSignerGroupOwner]().
    pub fn process_disable_signer_group_owner(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // signer group owner account
        let group_owner_info = next_account_info(account_info_iter)?;

        // Verify owner submission
        if !group_owner_info.is_signer {
            return Err(AudiusError::SignatureMissing.into());
        }

        let mut signer_group = Box::new(SignerGroup::try_from_slice(
            &signer_group_info.data.borrow(),
        )?);

        if !signer_group.is_initialized() {
            return Err(AudiusError::SignerGroupOwnerDisabled.into());
        }
        signer_group.version = Self::SIGNER_GROUP_VERSION;

        signer_group.owner_enabled = false;
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

        // Verify owner submission
        if !signer_groups_owner_info.is_signer {
            return Err(AudiusError::SignatureMissing.into());
        }

        let signer_group = Box::new(SignerGroup::try_from_slice(
            &signer_group_info.data.borrow(),
        )?);

        if !signer_group.is_initialized() {
            return Err(AudiusError::UninitializedSignerGroup.into());
        }

        // Reject if owner has been disabled
        if !signer_group.owner_enabled {
            return Err(AudiusError::SignerGroupOwnerDisabled.into());
        }

        let mut valid_signer = Box::new(ValidSigner::try_from_slice(
            &valid_signer_info.data.borrow(),
        )?);

        if valid_signer.is_initialized() {
            return Err(AudiusError::SignerAlreadyInitialized.into());
        }

        signer_group.check_owner(&signer_groups_owner_info)?;

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

        // Verify owner submission
        if !signer_groups_owner_info.is_signer {
            return Err(AudiusError::SignatureMissing.into());
        }

        let signer_group = Box::new(SignerGroup::try_from_slice(
            &signer_group_info.data.borrow(),
        )?);

        if !signer_group.is_initialized() {
            return Err(AudiusError::UninitializedSignerGroup.into());
        }

        // Reject if owner has been disabled
        if !signer_group.owner_enabled {
            return Err(AudiusError::SignerGroupOwnerDisabled.into());
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

    /// Process [ValidateMultipleSignaturesAddSigner]()
    pub fn process_multiple_signatures_add_signer(
        accounts: &[AccountInfo],
        signature_data_1: SignatureData,
        signature_data_2: SignatureData,
        eth_address: [u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE],
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // initialized valid signer account 1
        let valid_signer_1_info = next_account_info(account_info_iter)?;
        // initialized valid signer account 2
        let valid_signer_2_info = next_account_info(account_info_iter)?;
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // incoming valid signer account
        let new_valid_signer_info = next_account_info(account_info_iter)?;

        // Confirm both signatures are valid
        // Sysvar Instruction account info
        let instruction_info = next_account_info(account_info_iter)?;
        // Index of current instruction in tx
        let index = sysvar::instructions::load_current_index(&instruction_info.data.borrow());

        if index == 0 {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }

        // Instruction data of 1st Secp256 program call
        let secp_instruction_1 = sysvar::instructions::load_instruction_at(
            (index - 2) as usize,
            &instruction_info.data.borrow(),
        )
        .unwrap();

        // Instruction data of 2nd Secp256 program call
        let secp_instruction_2 = sysvar::instructions::load_instruction_at(
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

        // Create and write new valid signer
        let mut new_valid_signer = Box::new(ValidSigner::try_from_slice(
            &new_valid_signer_info.data.borrow(),
        )?);

        if new_valid_signer.is_initialized() {
            return Err(AudiusError::SignerAlreadyInitialized.into());
        }

        let valid_signer_1 = Box::new(ValidSigner::try_from_slice(
            &valid_signer_1_info.data.borrow(),
        )?);
        let valid_signer_2 = Box::new(ValidSigner::try_from_slice(
            &valid_signer_2_info.data.borrow(),
        )?);

        if !valid_signer_1.is_initialized() || !valid_signer_2.is_initialized() {
            return Err(AudiusError::ValidSignerNotInitialized.into());
        }

        if valid_signer_1.signer_group != *signer_group_info.key ||
           valid_signer_2.signer_group != *signer_group_info.key
        {
            return Err(AudiusError::WrongSignerGroup.into());
        }

        let instruction_data_1 = Self::recover_instruction_data(
            &signature_data_1,
            &valid_signer_1
        );

        let instruction_data_2 = Self::recover_instruction_data(
            &signature_data_2,
            &valid_signer_2
        );

        if instruction_data_1 != secp_instruction_1.data {
            return Err(AudiusError::SignatureVerificationFailed.into());
        }

        if instruction_data_2 != secp_instruction_2.data {
            return Err(AudiusError::SignatureVerificationFailed.into());
        }

        new_valid_signer.version = Self::VALID_SIGNER_VERSION;
        new_valid_signer.signer_group = *signer_group_info.key;
        new_valid_signer.eth_address = eth_address;
        new_valid_signer
            .serialize(&mut *new_valid_signer_info.data.borrow_mut())
            .map_err(|e| e.into())
    }

    /// Process [ValidateMultipleSignatures]().
    pub fn process_multiple_signatures(
        accounts: &[AccountInfo],
        signature_data_1: SignatureData,
        signature_data_2: SignatureData,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // initialized valid signer account 1
        let valid_signer_1_info = next_account_info(account_info_iter)?;
        // initialized valid signer account 2
        let valid_signer_2_info = next_account_info(account_info_iter)?;
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // Sysvar Instruction account info
        let instruction_info = next_account_info(account_info_iter)?;
        // Index of current instruction in tx
        let index = sysvar::instructions::load_current_index(&instruction_info.data.borrow());

        if index == 0 {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }

        // Instruction data of 1st Secp256 program call
        let secp_instruction_1 = sysvar::instructions::load_instruction_at(
            (index - 2) as usize,
            &instruction_info.data.borrow(),
        )
        .unwrap();

        // Instruction data of 2nd Secp256 program call
        let secp_instruction_2 = sysvar::instructions::load_instruction_at(
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

        let valid_signer_1 = Box::new(ValidSigner::try_from_slice(
            &valid_signer_1_info.data.borrow(),
        )?);
        let valid_signer_2 = Box::new(ValidSigner::try_from_slice(
            &valid_signer_2_info.data.borrow(),
        )?);

        if !valid_signer_1.is_initialized() || !valid_signer_2.is_initialized() {
            return Err(AudiusError::ValidSignerNotInitialized.into());
        }

        if valid_signer_1.signer_group != *signer_group_info.key ||
           valid_signer_2.signer_group != *signer_group_info.key
        {
            return Err(AudiusError::WrongSignerGroup.into());
        }

        let instruction_data_1 = Self::recover_instruction_data(
            &signature_data_1,
            &valid_signer_1
        );

        let instruction_data_2 = Self::recover_instruction_data(
            &signature_data_2,
            &valid_signer_2
        );

        if instruction_data_1 != secp_instruction_1.data {
            return Err(AudiusError::SignatureVerificationFailed.into());
        }

        if instruction_data_2 != secp_instruction_2.data {
            return Err(AudiusError::SignatureVerificationFailed.into());
        }

        Ok(())
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

        let instruction_data = Self::recover_instruction_data(
            &signature_data,
            &valid_signer
        );

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
            AudiusInstruction::ClearValidSigner => {
                msg!("Instruction: ClearValidSigner");
                Self::process_clear_valid_signer(accounts)
            }
            AudiusInstruction::ValidateSignature(signature) => {
                msg!("Instruction: ValidateSignature");
                Self::process_validate_signature(accounts, signature)
            }
            AudiusInstruction::DisableSignerGroupOwner => {
                msg!("Instruction: DisableSignerGroupOwner");
                Self::process_disable_signer_group_owner(accounts)
            }
            AudiusInstruction::ValidateMultipleSignatures(
                signature_1,
                signature_2
            ) => {
                msg!("Instruction: ValidateMultipleSignatures");
                Self::process_multiple_signatures(
                    accounts,
                    signature_1,
                    signature_2
                )
            }
            AudiusInstruction::ValidateMultipleSignaturesAddSigner(
                signature_1,
                signature_2,
                eth_pubkey
            ) => {
                msg!("Instruction: ValidateMultipleSignaturesAddSigner");
                Self::process_multiple_signatures_add_signer(
                    accounts,
                    signature_1,
                    signature_2,
                    eth_pubkey
                )
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
            AudiusError::SignerGroupOwnerDisabled => msg!("Signer group owner disabled"),
        }
    }
}
