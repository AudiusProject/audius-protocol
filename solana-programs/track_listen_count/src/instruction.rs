//! Instruction types

use crate::state::TrackData;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar,
};

/// Instruction arguments
#[repr(C)]
#[derive(BorshSerialize, BorshDeserialize, Clone)]
pub struct InstructionArgs {
    /// data of track
    pub track_data: TrackData,
    /// signature to verify
    pub signature: [u8; audius_eth_registry::state::SecpSignatureOffsets::SECP_SIGNATURE_SIZE],
    /// recovery ID used to verify signature
    pub recovery_id: u8,
}

/// Instruction definition
#[repr(C)]
#[derive(BorshSerialize, BorshDeserialize, Clone)]
pub enum TemplateInstruction {
    ///   Example
    ///
    ///   1. [] Valid signer account
    ///   2. [] Signer group
    ///   3. [] Audius program account
    ///   4. [] Sysvar instruction account
    ///   5. [] Sysvar clock account
    ExampleInstruction(InstructionArgs),
}

/// Create `Example` instruction
pub fn init(
    program_id: &Pubkey,
    valid_signer_account: &Pubkey,
    signer_group: &Pubkey,
    track_data: InstructionArgs,
) -> Result<Instruction, ProgramError> {
    let init_data = TemplateInstruction::ExampleInstruction(track_data);
    let data = init_data
        .try_to_vec()
        .or(Err(ProgramError::InvalidArgument))?;
    let accounts = vec![
        AccountMeta::new_readonly(*valid_signer_account, false),
        AccountMeta::new_readonly(*signer_group, false),
        AccountMeta::new_readonly(audius_eth_registry::id(), false),
        AccountMeta::new_readonly(sysvar::instructions::id(), false),
        AccountMeta::new_readonly(sysvar::clock::id(), false),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}
