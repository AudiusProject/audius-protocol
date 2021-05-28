//! Program state processor

use crate::{
    error::TrackListenCountError,
    instruction::{InstructionArgs, TemplateInstruction},
};
use solana_program::clock::UnixTimestamp;
use audius_eth_registry::instruction::SignatureData;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::next_account_info, account_info::AccountInfo, entrypoint::ProgramResult, msg,
    program::invoke, pubkey::Pubkey, sysvar::clock::Clock, sysvar::Sysvar,
};

// Maximum time between multiple signer submission for adding additional
// signers.
// 10 minutes
const MAX_TIME_DIFF_SECONDS: UnixTimestamp = 600;

/// Program state handler.
pub struct Processor {}
impl Processor {
    /// Call Audius program to verify signature
    pub fn process_track_listen_instruction(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: InstructionArgs,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        // initialized valid signer account
        let valid_signer_info = next_account_info(account_info_iter)?;
        // signer group account
        let signer_group_info = next_account_info(account_info_iter)?;
        // audius account
        let audius_account_info = next_account_info(account_info_iter)?;
        // sysvar instruction
        let sysvar_instruction = next_account_info(account_info_iter)?;
        // clock sysvar account
        let clock_account_info = next_account_info(account_info_iter)?;
        let clock = Clock::from_account_info(&clock_account_info)?;

        if (clock.unix_timestamp - instruction_data.track_data.timestamp).abs() > MAX_TIME_DIFF_SECONDS {
            return Err(TrackListenCountError::InvalidTimestamp.into());
        }

        let signature_data = Box::new(SignatureData {
            signature: instruction_data.signature,
            recovery_id: instruction_data.recovery_id,
            message: instruction_data
                .track_data
                .try_to_vec()
                .or(Err(TrackListenCountError::InvalidTrackData))?,
        });

        invoke(
            &audius_eth_registry::instruction::validate_signature_with_sysvar(
                &audius_eth_registry::id(),
                valid_signer_info.key,
                signer_group_info.key,
                sysvar_instruction.key,
                *signature_data,
            )
            .unwrap(),
            &[
                audius_account_info.clone(),
                valid_signer_info.clone(),
                signer_group_info.clone(),
                sysvar_instruction.clone(),
            ],
        )?;

        Ok(())
    }

    /// Processes an instruction
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        input: &[u8],
    ) -> ProgramResult {
        let instruction = TemplateInstruction::try_from_slice(input)
            .or(Err(TrackListenCountError::InstructionUnpackError))?;
        match instruction {
            TemplateInstruction::TrackListenInstruction(signature_data) => {
                msg!("Instruction: TrackListenInstruction");
                Self::process_track_listen_instruction(program_id, accounts, signature_data)
            }
        }
    }
}
