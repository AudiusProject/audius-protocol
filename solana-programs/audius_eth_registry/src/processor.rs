//! Program state processor

use crate::error::AudiusError;
use crate::instruction::{AudiusInstruction, SignatureData};
use crate::state::{SecpSignatureOffsets, SignerGroup, ValidSigner};
use borsh::{BorshDeserialize, BorshSerialize};
use num_traits::FromPrimitive;
use solana_program::instruction::Instruction;
use solana_program::decode_error::DecodeError;
use solana_program::clock::UnixTimestamp;
use solana_program::program_error::PrintProgramError;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    sysvar,
    sysvar::clock::Clock,
    sysvar::Sysvar,
    secp256k1_program
};

// Maximum time between multiple signer submission for adding additional
// signers.
// 10 minutes
const MAX_TIME_DIFF_SECONDS: UnixTimestamp = 600;

/// Program state handler
pub struct Processor {}
impl Processor {
    /// SignerGroup version indicating group initialization
    pub const SIGNER_GROUP_VERSION: u8 = 1;

    /// ValidSigner version indicating signer initialization
    pub const VALID_SIGNER_VERSION: u8 = 1;

    /// ValidSigner version indicating signer uninitialization
    pub const VALID_SIGNER_UNINITIALIZED_VERSION: u8 = 0;

    fn validate_eth_signature(
        expected_signer: [u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE],
        message: &[u8],
        secp_instruction_data: Vec<u8>,
    ) -> Result<(), AudiusError> {
        let eth_address_offset = 12;
        let instruction_signer = secp_instruction_data
            [eth_address_offset..eth_address_offset + SecpSignatureOffsets::ETH_ADDRESS_SIZE]
            .to_vec();
        if instruction_signer != expected_signer {
            return Err(AudiusError::SignatureVerificationFailed.into());
        }

        let message_data_offset = 97; // meta (12) + address (20) + signature (65) = 97
        let instruction_message = secp_instruction_data[message_data_offset..].to_vec();
        if instruction_message != message {
            return Err(AudiusError::SignatureVerificationFailed.into());
        }
        Ok(())
    }

    /// Process [Convert i64 from Vec<u8>] ()
    pub fn int_from_vec(
        message: &Vec<u8>
    ) -> i64 {
        let mut intermediate_array = [0u8; 8];
        intermediate_array[0..8].copy_from_slice(message);
        return i64::from_le_bytes(intermediate_array);
    }

    /// Process [validate timestamp messages] ()
    pub fn validate_timestamp_messages(
        clock: &sysvar::clock::Clock,
        message_1: &Vec<u8>,
        message_2: &Vec<u8>,
        message_3: &Vec<u8>,
    ) -> Result<(), AudiusError> {
        let timestamp_1: i64 = Self::int_from_vec(message_1);
        let timestamp_2: i64 = Self::int_from_vec(message_2);
        let timestamp_3: i64 = Self::int_from_vec(message_3);

        if (clock.unix_timestamp - timestamp_1).abs() > MAX_TIME_DIFF_SECONDS
            || (clock.unix_timestamp - timestamp_2).abs() > MAX_TIME_DIFF_SECONDS
            || (clock.unix_timestamp - timestamp_3).abs() > MAX_TIME_DIFF_SECONDS
        {
            return Err(AudiusError::InvalidInstruction.into());
        }

        return std::result::Result::Ok(());
    }


    /// Process [Recover SECP Instructions]().
    pub fn recover_secp_instructions(
        instruction_info: &AccountInfo
    ) -> Result<Vec<Instruction>, AudiusError> {
        let mut v: Vec<Instruction> = Vec::new();
        // Index of current instruction in tx
        let index = sysvar::instructions::load_current_index(&instruction_info.data.borrow());
        // Indicates no instructions present
        if index == 0 {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }
        // Iterate over all instructions and recover SECP instruction
        let mut iterator = 0;
        while iterator < index {
            let secp_instruction = sysvar::instructions::load_instruction_at(
                iterator as usize,
                &instruction_info.data.borrow(),
            ).map_err(|_| AudiusError::SignatureMissing)?;

            if secp_instruction.program_id != secp256k1_program::id() {
                return Err(AudiusError::SignatureVerificationFailed.into());
            }

            v.push(secp_instruction);
            iterator+=1;
        }

        return std::result::Result::Ok(v);
    }

    /// Process [InitSignerGroup]().
    pub fn process_init_signer_group(
        _program_id: &Pubkey,
        accounts: &[AccountInfo]
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // signer group owner account
        let group_owner_info = next_account_info(account_info_iter)?;

        // Confirm program ownership of SignerGroup Account
        if signer_group_info.owner != _program_id {
            return Err(AudiusError::InvalidInstruction.into());
        }

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
    pub fn process_disable_signer_group_owner(
        _program_id: &Pubkey,
        accounts: &[AccountInfo]
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // signer group owner account
        let group_owner_info = next_account_info(account_info_iter)?;

        // Confirm program ownership of SignerGroup and ValidSigner
        if signer_group_info.owner != _program_id {
            return Err(AudiusError::InvalidInstruction.into());
        }

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
        _program_id: &Pubkey,
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

        // Confirm program ownership of SignerGroup and ValidSigner
        if valid_signer_info.owner != _program_id
            || signer_group_info.owner != _program_id {
            return Err(AudiusError::InvalidInstruction.into());
        }

        // Verify SignerGroupOwner submission of this transaction
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
    pub fn process_clear_valid_signer(
        _program_id: &Pubkey,
        accounts: &[AccountInfo]
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // initialized valid signer account
        let valid_signer_info = next_account_info(account_info_iter)?;
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // signer group's owner
        let signer_groups_owner_info = next_account_info(account_info_iter)?;

        // Confirm program ownership of SignerGroup and ValidSigner
        if valid_signer_info.owner != _program_id
            || signer_group_info.owner != _program_id {
            return Err(AudiusError::InvalidInstruction.into());
        }

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

    /// Process [ValidateMultipleSignaturesClearValidSigner]().
    pub fn process_multiple_signatures_clear_valid_signer(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
        signature_data_1: SignatureData,
        signature_data_2: SignatureData,
        signature_data_3: SignatureData,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // initialized valid signer account 1
        let valid_signer_1_info = next_account_info(account_info_iter)?;
        // initialized valid signer account 2
        let valid_signer_2_info = next_account_info(account_info_iter)?;
        // initialized valid signer account 3
        let valid_signer_3_info = next_account_info(account_info_iter)?;
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // incoming valid signer account
        let old_valid_signer_info = next_account_info(account_info_iter)?;
        // Sysvar Instruction account info
        let instruction_info = next_account_info(account_info_iter)?;

        // Confirm program ownership of SignerGroup and ValidSigners
        if valid_signer_1_info.owner != _program_id
            || valid_signer_2_info.owner != _program_id
            || valid_signer_3_info.owner != _program_id
            || old_valid_signer_info.owner != _program_id
            || signer_group_info.owner != _program_id {
            return Err(AudiusError::InvalidInstruction.into());
        }

        // clock sysvar account
        let clock_account_info = next_account_info(account_info_iter)?;
        let clock = Clock::from_account_info(&clock_account_info)?;

        // Recover all secp instructions present in this tx
        let instruction_recovery = Self::recover_secp_instructions(&instruction_info);
        if instruction_recovery.is_err() {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }

        let recovered_instructions = instruction_recovery?;
        if recovered_instructions.len() < 3 {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }

        let secp_instruction_1 = &recovered_instructions[0];
        let secp_instruction_2 = &recovered_instructions[1];
        let secp_instruction_3 = &recovered_instructions[2];

        let valid_signer_1 = Box::new(ValidSigner::try_from_slice(
            &valid_signer_1_info.data.borrow(),
        )?);
        let valid_signer_2 = Box::new(ValidSigner::try_from_slice(
            &valid_signer_2_info.data.borrow(),
        )?);
        let valid_signer_3 = Box::new(ValidSigner::try_from_slice(
            &valid_signer_3_info.data.borrow(),
        )?);

        if !valid_signer_1.is_initialized()
            || !valid_signer_2.is_initialized()
            || !valid_signer_3.is_initialized()
        {
            return Err(AudiusError::ValidSignerNotInitialized.into());
        }

        if valid_signer_1.signer_group != *signer_group_info.key
            || valid_signer_2.signer_group != *signer_group_info.key
            || valid_signer_3.signer_group != *signer_group_info.key
        {
            return Err(AudiusError::WrongSignerGroup.into());
        }

        Self::validate_eth_signature(
            valid_signer_1.eth_address,
            &signature_data_1.message,
            secp_instruction_1.data.clone()
        )?;

        Self::validate_eth_signature(
            valid_signer_2.eth_address,
            &signature_data_2.message,
            secp_instruction_2.data.clone()
        )?;

        Self::validate_eth_signature(
            valid_signer_3.eth_address,
            &signature_data_3.message,
            secp_instruction_3.data.clone()
        )?;

        let signer_group = Box::new(SignerGroup::try_from_slice(
            &signer_group_info.data.borrow(),
        )?);

        if !signer_group.is_initialized() {
            return Err(AudiusError::UninitializedSignerGroup.into());
        }

        // Each signature data message is expected to be a recent unix timestamp
        // If messages do not adhere to this format, the operation will fail
        let timestamp_result = Self::validate_timestamp_messages(
            &clock,
            &signature_data_1.message,
            &signature_data_2.message,
            &signature_data_3.message,
        );

        if timestamp_result.is_err() {
            return Err(AudiusError::SignatureVerificationFailed.into());
        }

        let mut old_valid_signer = Box::new(ValidSigner::try_from_slice(
            &old_valid_signer_info.data.borrow(),
        )?);

        if !old_valid_signer.is_initialized() {
            return Err(AudiusError::ValidSignerNotInitialized.into());
        }

        if old_valid_signer.signer_group != *signer_group_info.key {
            return Err(AudiusError::WrongSignerGroup.into());
        }

        old_valid_signer.version = Self::VALID_SIGNER_UNINITIALIZED_VERSION;
        old_valid_signer
            .serialize(&mut *old_valid_signer_info.data.borrow_mut())
            .map_err(|e| e.into())
    }

    /// Process [ValidateMultipleSignaturesAddSigner]()
    pub fn process_multiple_signatures_add_signer(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
        signature_data_1: SignatureData,
        signature_data_2: SignatureData,
        signature_data_3: SignatureData,
        eth_address: [u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE],
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // initialized valid signer account 1
        let valid_signer_1_info = next_account_info(account_info_iter)?;
        // initialized valid signer account 2
        let valid_signer_2_info = next_account_info(account_info_iter)?;
        // initialized valid signer account 3
        let valid_signer_3_info = next_account_info(account_info_iter)?;
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // incoming valid signer account
        let new_valid_signer_info = next_account_info(account_info_iter)?;
        // Sysvar Instruction account info
        let instruction_info = next_account_info(account_info_iter)?;

        // Confirm program ownership of SignerGroup and ValidSigners
        if valid_signer_1_info.owner != _program_id
            || valid_signer_2_info.owner != _program_id
            || valid_signer_3_info.owner != _program_id
            || new_valid_signer_info.owner != _program_id
            || signer_group_info.owner != _program_id {
            return Err(AudiusError::InvalidInstruction.into());
        }

        // clock sysvar account
        let clock_account_info = next_account_info(account_info_iter)?;
        let clock = Clock::from_account_info(&clock_account_info)?;

        // Recover all secp instructions present in this tx
        let instruction_recovery = Self::recover_secp_instructions(&instruction_info);
        if instruction_recovery.is_err() {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }

        let recovered_instructions = instruction_recovery?;
        if recovered_instructions.len() < 3 {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }

        let secp_instruction_1 = &recovered_instructions[0];
        let secp_instruction_2 = &recovered_instructions[1];
        let secp_instruction_3 = &recovered_instructions[2];

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
        let valid_signer_3 = Box::new(ValidSigner::try_from_slice(
            &valid_signer_3_info.data.borrow(),
        )?);

        if !valid_signer_1.is_initialized()
            || !valid_signer_2.is_initialized()
            || !valid_signer_3.is_initialized()
        {
            return Err(AudiusError::ValidSignerNotInitialized.into());
        }

        if valid_signer_1.signer_group != *signer_group_info.key
            || valid_signer_2.signer_group != *signer_group_info.key
            || valid_signer_3.signer_group != *signer_group_info.key
        {
            return Err(AudiusError::WrongSignerGroup.into());
        }

        Self::validate_eth_signature(
            valid_signer_1.eth_address,
            &signature_data_1.message,
            secp_instruction_1.data.clone()
        )?;

        Self::validate_eth_signature(
            valid_signer_2.eth_address,
            &signature_data_2.message,
            secp_instruction_2.data.clone()
        )?;

        Self::validate_eth_signature(
            valid_signer_3.eth_address,
            &signature_data_3.message,
            secp_instruction_3.data.clone()
        )?;


        // Each signature data message is expected to be a recent unix timestamp
        // If messages do not adhere to this format, the operation will fail
        let timestamp_result = Self::validate_timestamp_messages(
            &clock,
            &signature_data_1.message,
            &signature_data_2.message,
            &signature_data_3.message,
        );

        if timestamp_result.is_err() {
            return Err(AudiusError::SignatureVerificationFailed.into());
        }

        new_valid_signer.version = Self::VALID_SIGNER_VERSION;
        new_valid_signer.signer_group = *signer_group_info.key;
        new_valid_signer.eth_address = eth_address;
        new_valid_signer
            .serialize(&mut *new_valid_signer_info.data.borrow_mut())
            .map_err(|e| e.into())
    }

    /// Process [ValidateSignature]().
    pub fn process_validate_signature(
        _program_id: &Pubkey,
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

        // Confirm program ownership of SignerGroup and ValidSigner
        if valid_signer_info.owner != _program_id
            || signer_group_info.owner != _program_id {
            return Err(AudiusError::InvalidInstruction.into());
        }

        // Recover all secp instructions present in this tx
        let instruction_recovery = Self::recover_secp_instructions(&instruction_info);
        if instruction_recovery.is_err() {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }

        let recovered_instructions = instruction_recovery?;
        if recovered_instructions.len() < 1 {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }

        let secp_instruction = &recovered_instructions[0];

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

        Self::validate_eth_signature(
            valid_signer.eth_address,
            &signature_data.message,
            secp_instruction.data.clone()
        )?;

        Ok(())
    }

    /// Process an [Instruction]().
    pub fn process(_program_id: &Pubkey, accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
        let instruction = AudiusInstruction::try_from_slice(input)?;

        match instruction {
            AudiusInstruction::InitSignerGroup => {
                msg!("Instruction: InitSignerGroup");
                Self::process_init_signer_group(_program_id, accounts)
            }
            AudiusInstruction::InitValidSigner(eth_pubkey) => {
                msg!("Instruction: InitValidSigner");
                Self::process_init_valid_signer(
                    _program_id,
                    accounts,
                    eth_pubkey
                )
            }
            AudiusInstruction::ClearValidSigner => {
                msg!("Instruction: ClearValidSigner");
                Self::process_clear_valid_signer(
                    _program_id,
                    accounts
                )
            }
            AudiusInstruction::ValidateMultipleSignaturesClearValidSigner(
                signature_1,
                signature_2,
                signature_3,
            ) => {
                msg!("Instruction: ValidateMultipleSignaturesClearValidSigner");
                Self::process_multiple_signatures_clear_valid_signer(
                    _program_id,
                    accounts,
                    signature_1,
                    signature_2,
                    signature_3,
                )
            }
            AudiusInstruction::ValidateSignature(signature) => {
                msg!("Instruction: ValidateSignature");
                Self::process_validate_signature(
                    _program_id,
                    accounts,
                    signature
                )
            }
            AudiusInstruction::DisableSignerGroupOwner => {
                msg!("Instruction: DisableSignerGroupOwner");
                Self::process_disable_signer_group_owner(_program_id, accounts)
            }
            AudiusInstruction::ValidateMultipleSignaturesAddSigner(
                signature_1,
                signature_2,
                signature_3,
                eth_pubkey,
            ) => {
                msg!("Instruction: ValidateMultipleSignaturesAddSigner");
                Self::process_multiple_signatures_add_signer(
                    _program_id,
                    accounts,
                    signature_1,
                    signature_2,
                    signature_3,
                    eth_pubkey,
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
