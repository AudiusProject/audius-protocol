//! Instruction types

use crate::state::SecpSignatureOffsets;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar,
};

/// Signature with message to validate
#[repr(C)]
#[derive(Clone, BorshDeserialize, BorshSerialize)]
pub struct SignatureData {
    /// Secp256k1 signature
    pub signature: [u8; SecpSignatureOffsets::SECP_SIGNATURE_SIZE],
    /// Ethereum signature recovery ID
    pub recovery_id: u8,
    /// Signed message
    pub message: Vec<u8>,
}

/// Instructions supported by the Audius program
#[repr(C)]
#[derive(Clone, BorshDeserialize, BorshSerialize)]
pub enum AudiusInstruction {
    ///   Create new signer group account
    ///
    ///   0. `[w]` New SignerGroup to create
    ///   1. `[]` SignerGroup's owner
    InitSignerGroup,
    ///   Create new valid signer account
    ///
    ///   0. `[w]` Uninitialized valid signer account
    ///   1. `[]` Group for Valid Signer to join with
    ///   2. `[s]` SignerGroup's owner
    InitValidSigner([u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE]),
    ///   Remove valid signer from the group
    ///
    ///   0. `[w]` Initialized valid signer to remove
    ///   1. `[]` Signer group to remove from
    ///   2. `[s]` SignerGroup's owner
    ClearValidSigner,
    ///   Validate signature issued by valid signer
    ///
    ///   0. `[]` Initialized valid signer
    ///   1. `[]` Signer group signer belongs to
    ValidateSignature(SignatureData),
    ///
    ///   0. `[w]` SignerGroup to disable
    ///   1. `[]` SignerGroup's owner
    DisableSignerGroupOwner,
    ///   Validate multiple signatures issued by valid signers
    ///
    ///   0. `[]` Initialized valid signer 1
    ///   1. `[]` Initialized valid signer 2
    ///   2. `[]` Signer group signer belongs to
    ValidateMultipleSignatures(SignatureData, SignatureData),
    ///   0. `[]`  Initialized valid signer 1
    ///   1. `[]`  Initialized valid signer 2
    ///   2. `[]`  Signer group signer belongs to
    ///   3. `[w]` Incoming ValidSigner account
    ValidateMultipleSignaturesAddSigner(
        SignatureData,
        SignatureData,
        [u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE]
    ),
}

/// Creates `InitSignerGroup` instruction
pub fn init_signer_group(
    program_id: &Pubkey,
    signer_group: &Pubkey,
    owner: &Pubkey,
) -> Result<Instruction, ProgramError> {
    let accounts = vec![
        AccountMeta::new(*signer_group, false),
        AccountMeta::new_readonly(*owner, false),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data: AudiusInstruction::InitSignerGroup.try_to_vec()?,
    })
}

/// Creates `InitValidSigner` instruction
pub fn init_valid_signer(
    program_id: &Pubkey,
    valid_signer_account: &Pubkey,
    signer_group: &Pubkey,
    groups_owner: &Pubkey,
    eth_pubkey: [u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE],
) -> Result<Instruction, ProgramError> {
    let args = AudiusInstruction::InitValidSigner(eth_pubkey);
    let data = args.try_to_vec()?;

    let accounts = vec![
        AccountMeta::new(*valid_signer_account, false),
        AccountMeta::new_readonly(*signer_group, false),
        AccountMeta::new_readonly(*groups_owner, true),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates `ClearValidSigner` instruction
pub fn clear_valid_signer(
    program_id: &Pubkey,
    valid_signer_account: &Pubkey,
    signer_group: &Pubkey,
    groups_owner: &Pubkey,
) -> Result<Instruction, ProgramError> {
    let accounts = vec![
        AccountMeta::new(*valid_signer_account, false),
        AccountMeta::new_readonly(*signer_group, false),
        AccountMeta::new_readonly(*groups_owner, true),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data: AudiusInstruction::ClearValidSigner.try_to_vec()?,
    })
}

/// Creates `ValidateSignature` instruction
pub fn validate_signature(
    program_id: &Pubkey,
    valid_signer_account: &Pubkey,
    signer_group: &Pubkey,
    signature_data: SignatureData,
) -> Result<Instruction, ProgramError> {
    let args = AudiusInstruction::ValidateSignature(signature_data);
    let data = args.try_to_vec()?;

    let accounts = vec![
        AccountMeta::new_readonly(*valid_signer_account, false),
        AccountMeta::new_readonly(*signer_group, false),
        AccountMeta::new_readonly(sysvar::instructions::id(), false),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates `ValidateMultipleSignaturesAddSigner` instruction
pub fn validate_multiple_signatures_add_signer(
    program_id: &Pubkey,
    valid_signer_1: &Pubkey,
    valid_signer_2: &Pubkey,
    signer_group: &Pubkey,
    new_valid_signer: &Pubkey,
    signature_data_1: SignatureData,
    signature_data_2: SignatureData,
    eth_pubkey: [u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE],
) -> Result<Instruction, ProgramError> {
    let args = AudiusInstruction::ValidateMultipleSignaturesAddSigner(
        signature_data_1,
        signature_data_2,
        eth_pubkey
    );
    let data = args.try_to_vec()?;
    let accounts = vec![
        AccountMeta::new_readonly(*valid_signer_1, false),
        AccountMeta::new_readonly(*valid_signer_2, false),
        AccountMeta::new_readonly(*signer_group, false),
        AccountMeta::new(*new_valid_signer, false),
        AccountMeta::new_readonly(sysvar::instructions::id(), false),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates `ValidateSignature` instruction
pub fn validate_multiple_signatures(
    program_id: &Pubkey,
    valid_signer_1: &Pubkey,
    valid_signer_2: &Pubkey,
    signer_group: &Pubkey,
    signature_data_1: SignatureData,
    signature_data_2: SignatureData,
) -> Result<Instruction, ProgramError> {
    let args = AudiusInstruction::ValidateMultipleSignatures(
        signature_data_1,
        signature_data_2
    );
    let data = args.try_to_vec()?;

    let accounts = vec![
        AccountMeta::new_readonly(*valid_signer_1, false),
        AccountMeta::new_readonly(*valid_signer_2, false),
        AccountMeta::new_readonly(*signer_group, false),
        AccountMeta::new_readonly(sysvar::instructions::id(), false),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates `ValidateSignatureWithSysvar` instruction
pub fn validate_signature_with_sysvar(
    program_id: &Pubkey,
    valid_signer_account: &Pubkey,
    signer_group: &Pubkey,
    sysvar_instruction: &Pubkey,
    signature_data: SignatureData,
) -> Result<Instruction, ProgramError> {
    let args = AudiusInstruction::ValidateSignature(signature_data);
    let data = args.try_to_vec()?;

    let accounts = vec![
        AccountMeta::new_readonly(*valid_signer_account, false),
        AccountMeta::new_readonly(*signer_group, false),
        AccountMeta::new_readonly(*sysvar_instruction, false),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates `DisableSignerGroupOwner` instruction
pub fn disable_signer_group_owner(
    program_id: &Pubkey,
    signer_group: &Pubkey,
    owner: &Pubkey,
) -> Result<Instruction, ProgramError> {
    let accounts = vec![
        AccountMeta::new(*signer_group, false),
        AccountMeta::new_readonly(*owner, true),
    ];
    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data: AudiusInstruction::DisableSignerGroupOwner.try_to_vec()?,
    })
}