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
        instruction_index: u8
    ) -> Result<(), AudiusError> {
        // Only single recovery expected
        if secp_instruction_data[0] != 1 {
            return Err(AudiusError::SignatureVerificationFailed.into());
        }
        let start = 1;
        let end = start + (SecpSignatureOffsets::SIGNATURE_OFFSETS_SERIALIZED_SIZE as usize);
        let sig_offsets_struct = SecpSignatureOffsets::try_from_slice(
            &secp_instruction_data[start..end]
        )
        .map_err(|_| AudiusError::SignatureVerificationFailed)?;
        // eth address offset = 12
        let eth_address_offset = end;
        // signature_offset = eth address offset (12) + eth_pubkey.len (20) = 32
        let signature_offset = eth_address_offset + 20;
        // message_data_offset = signature_offset + signature_arr.len (65) = 97
        // eth address (12) + address (20) + signature (65) = 97
        let message_data_offset = signature_offset + 65;

        if sig_offsets_struct.message_instruction_index != instruction_index ||
            sig_offsets_struct.signature_instruction_index != instruction_index ||
            sig_offsets_struct.eth_address_instruction_index != instruction_index {
            return Err(AudiusError::SignatureVerificationFailed.into());
        }

        // Validate each offset is as expected
        if sig_offsets_struct.eth_address_offset != (eth_address_offset as u16) ||
            sig_offsets_struct.signature_offset != (signature_offset as u16) ||
            sig_offsets_struct.message_data_offset != (message_data_offset as u16) {
           return Err(AudiusError::SignatureVerificationFailed.into());
        }

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
    ) -> Result<Vec<(Instruction, u16)>, AudiusError> {
        let mut v: Vec<(Instruction, u16)> = Vec::new();
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

            v.push((secp_instruction, iterator));
            iterator+=1;
        }

        return std::result::Result::Ok(v);
    }

    /// Process [ValidateSignerData]().
    /// Validates eth signature recovery for each provided ValidSigner
    pub fn validate_signer_data(
        instruction_info: &AccountInfo,
        signer_group_info: &AccountInfo,
        valid_signer_accounts: &[&AccountInfo],
        signature_data_array: &[&SignatureData]
    ) -> Result<(), AudiusError> {

        let instruction_recovery = Self::recover_secp_instructions(&instruction_info);
        if instruction_recovery.is_err() {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }

        let recovered_instructions = instruction_recovery?;
        if recovered_instructions.len() < valid_signer_accounts.len()
            || recovered_instructions.len() < signature_data_array.len() {
            return Err(AudiusError::Secp256InstructionLosing.into());
        }

        for i in 0..recovered_instructions.len() {
            let (secp_instruction, instruction_index) = &recovered_instructions[i];
            let valid_signer_info = valid_signer_accounts[i];
            let signature_data = signature_data_array[i];

            let valid_signer = Box::new(ValidSigner::try_from_slice(
                &valid_signer_info.data.borrow(),
            ).map_err(|_| AudiusError::InvalidInstruction)?);

            if !valid_signer.is_initialized()
            {
                return Err(AudiusError::ValidSignerNotInitialized.into());
            }

            if valid_signer.signer_group != *signer_group_info.key
            {
                return Err(AudiusError::WrongSignerGroup.into());
            }

            Self::validate_eth_signature(
                valid_signer.eth_address,
                &signature_data.message,
                secp_instruction.data.clone(),
                *instruction_index as u8
            )?;
        }

        return std::result::Result::Ok(());
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

        // Confirm correct owner
        if signer_group.owner != *group_owner_info.key {
            return Err(AudiusError::WrongOwner.into());
        }

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

        let signer_group = Box::new(SignerGroup::try_from_slice(
            &signer_group_info.data.borrow(),
        )?);

        if !signer_group.is_initialized() {
            return Err(AudiusError::UninitializedSignerGroup.into());
        }

        let valid_signer_acct_array = [valid_signer_1_info, valid_signer_2_info, valid_signer_3_info];
        let sig_data_array = [&signature_data_1, &signature_data_2, &signature_data_3];
        Self::validate_signer_data(
            &instruction_info,
            &signer_group_info,
            &valid_signer_acct_array,
            &sig_data_array
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

        let valid_signer_acct_array = [valid_signer_1_info, valid_signer_2_info, valid_signer_3_info];
        let sig_data_array = [&signature_data_1, &signature_data_2, &signature_data_3];
        Self::validate_signer_data(
            &instruction_info,
            &signer_group_info,
            &valid_signer_acct_array,
            &sig_data_array
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

        let signer_group = Box::new(SignerGroup::try_from_slice(
            &signer_group_info.data.borrow(),
        )?);

        if !signer_group.is_initialized() {
            return Err(AudiusError::UninitializedSignerGroup.into());
        }

        let valid_signer_acct_array = [valid_signer_info];
        let sig_data_array = [&signature_data];
        Self::validate_signer_data(
            &instruction_info,
            &signer_group_info,
            &valid_signer_acct_array,
            &sig_data_array
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

#[cfg(test)]
mod tests {
    use crate::processor::Processor;
    use solana_program::{instruction::Instruction, pubkey::Pubkey, secp256k1_program};
    use solana_sdk::{secp256k1_instruction::{SecpSignatureOffsets, construct_eth_pubkey}, transaction::Transaction};
    use sha3::Digest;
 
    #[test]
    fn test_eth_validation_bug() {
        let fake_sk = libsecp256k1::SecretKey::random(&mut rand_073::thread_rng());
        let fake_pk = libsecp256k1::PublicKey::from_secret_key(&fake_sk);
        // Don't need the real secret key
        let real_pk = libsecp256k1::PublicKey::from_secret_key(&libsecp256k1::SecretKey::random(&mut rand_073::thread_rng()));

        let fake_msg: Vec<u8> = (0..100).collect();
        let real_msg: Vec<u8> = (50..150).collect();
        let real_eth_pubkey = construct_eth_pubkey(&real_pk);
        let fake_eth_pubkey = construct_eth_pubkey(&fake_pk);

        let mut hasher = sha3::Keccak256::new();
        hasher.update(fake_msg.clone());
        let fake_message_hash = hasher.finalize();
        let mut fake_message_hash_arr = [0u8; 32];
        fake_message_hash_arr.copy_from_slice(&fake_message_hash.as_slice());
        let fake_message = libsecp256k1::Message::parse(&fake_message_hash_arr);
        let (fake_signature, fake_recovery_id) = libsecp256k1::sign(&fake_message, &fake_sk);
        let fake_signature_arr = fake_signature.serialize();

        let mut dummy_instr_data = vec![];
        let eth_addr_offset = dummy_instr_data.len();
        dummy_instr_data.extend_from_slice(&fake_eth_pubkey);
        let eth_sig_offset = dummy_instr_data.len(); 
        dummy_instr_data.extend_from_slice(&fake_signature_arr);
        dummy_instr_data.push(fake_recovery_id.serialize());
        let msg_offset = dummy_instr_data.len();
        dummy_instr_data.append(&mut fake_msg.clone());

        let dummy_instr_data_ind = 0;

        let secp_offsets_struct = SecpSignatureOffsets {
            eth_address_instruction_index: dummy_instr_data_ind,
            message_instruction_index: dummy_instr_data_ind,
            signature_instruction_index: dummy_instr_data_ind,
            eth_address_offset: eth_addr_offset as u16,
            message_data_offset: msg_offset as u16,
            message_data_size: fake_msg.len() as u16,
            signature_offset: eth_sig_offset as u16,
        };

        let mut secp_instr_data = vec![];
        secp_instr_data.push(1u8); // count
        secp_instr_data.append(&mut bincode::serialize(&secp_offsets_struct).unwrap());
        // Here's where we put the real pubkey, which our processor tries to validate
        secp_instr_data.extend_from_slice(&real_eth_pubkey);
        // Append dummy signature data
        let mut dummy_sig = (0..65).collect();
        secp_instr_data.append(&mut dummy_sig);
        // Append the real message
        secp_instr_data.append(&mut real_msg.clone());

        let dummy_instruction = Instruction {
            program_id: Pubkey::new_unique(),
            accounts: vec![],
            data: dummy_instr_data.clone(),
        };

        let secp_instruction = Instruction {
            program_id: secp256k1_program::id(),
            accounts: vec![],
            data: secp_instr_data.clone(),
        };
        
        let tx = Transaction::new_with_payer(&[dummy_instruction, secp_instruction], None);
        assert!(tx.verify_precompiles(false).is_ok());
        // Failure due to offsets mismatch
        assert!(Processor::validate_eth_signature(
            real_eth_pubkey.clone(),
            &real_msg,
            secp_instr_data.clone(),
            0
            ).is_err()
        );
    }
}