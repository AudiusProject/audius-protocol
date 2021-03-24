//! Instruction types

use crate::error::AudiusError;
use crate::state::SecpSignatureOffsets;
use solana_program::{
    instruction::{AccountMeta, Instruction},
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar,
};
use std::mem::size_of;

/// Signature with message to validate
#[repr(C)]
#[derive(Clone)]
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
#[derive(Clone)]
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
}
impl AudiusInstruction {
    /// Unpacks a byte buffer into a [AudiusInstruction]().
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, rest) = input.split_first().ok_or(AudiusError::InvalidInstruction)?;
        Ok(match tag {
            0 => Self::InitSignerGroup,
            1 => {
                let eth_pubkey: &[u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE] =
                    unpack_reference(rest)?;
                Self::InitValidSigner(*eth_pubkey)
            }
            2 => Self::ClearValidSigner,
            3 => {
                let mut signature: [u8; SecpSignatureOffsets::SECP_SIGNATURE_SIZE] =
                    [0u8; SecpSignatureOffsets::SECP_SIGNATURE_SIZE];
                signature.copy_from_slice(&rest[0..SecpSignatureOffsets::SECP_SIGNATURE_SIZE]);
                let signature_data = SignatureData {
                    signature,
                    recovery_id: rest[SecpSignatureOffsets::SECP_SIGNATURE_SIZE],
                    message: rest[SecpSignatureOffsets::SECP_SIGNATURE_SIZE + 1..].to_vec(),
                };
                Self::ValidateSignature(signature_data)
            }
            _ => return Err(AudiusError::InvalidInstruction.into()),
        })
    }

    /// Packs a [AudiusInstruction]() into a byte buffer.
    pub fn pack(&self) -> Vec<u8> {
        let mut buf = vec![0u8; size_of::<AudiusInstruction>()];
        match self {
            Self::InitSignerGroup => buf[0] = 0,
            Self::InitValidSigner(eth_pubkey) => {
                buf[0] = 1;
                #[allow(clippy::cast_ptr_alignment)]
                let packed_pubkey = unsafe {
                    &mut *(&mut buf[1] as *mut u8
                        as *mut [u8; SecpSignatureOffsets::ETH_ADDRESS_SIZE])
                };
                *packed_pubkey = *eth_pubkey;
            }
            Self::ClearValidSigner => buf[0] = 2,
            Self::ValidateSignature(signature_data) => {
                buf = vec![]; // do this because message len can be greater than size of AudiusInstruction
                buf.push(3);
                buf.extend_from_slice(&signature_data.signature);
                buf.push(signature_data.recovery_id);
                buf.extend_from_slice(&signature_data.message);
            }
        };
        buf
    }
}

/// Unpacks a reference from a bytes buffer.
pub fn unpack_reference<T>(input: &[u8]) -> Result<&T, ProgramError> {
    if input.len() < size_of::<u8>() + size_of::<T>() {
        return Err(ProgramError::InvalidAccountData);
    }
    #[allow(clippy::cast_ptr_alignment)]
    let val: &T = unsafe { &*(&input[0] as *const u8 as *const T) };
    Ok(val)
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
        data: AudiusInstruction::InitSignerGroup.pack(),
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
    let data = args.pack();

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
        data: AudiusInstruction::ClearValidSigner.pack(),
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
    let data = args.pack();

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

/// Creates `ValidateSignatureWithSysvar` instruction
pub fn validate_signature_with_sysvar(
    program_id: &Pubkey,
    valid_signer_account: &Pubkey,
    signer_group: &Pubkey,
    sysvar_instruction: &Pubkey,
    signature_data: SignatureData,
) -> Result<Instruction, ProgramError> {
    let args = AudiusInstruction::ValidateSignature(signature_data);
    let data = args.pack();

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
