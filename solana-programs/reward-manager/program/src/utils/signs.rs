#![allow(missing_docs)]
use super::*;
use crate::{
    error::{to_audius_program_error, AudiusProgramError},
    processor::SENDER_SEED_PREFIX,
    state::{SenderAccount, VoteMessage},
};
use borsh::BorshDeserialize;
use borsh::BorshSerialize;
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, instruction::Instruction,
    program_error::ProgramError, program_pack::IsInitialized, pubkey::Pubkey, secp256k1_program,
    sysvar,
};
use std::{
    collections::{BTreeMap, BTreeSet},
    convert::TryInto,
};

/// Attempts to retrieve all instructions before `index_current_instruction`
/// as secp recovery instructions, and asserts that it finds `necessary_instructions_count`
/// instructions.
/// Returns a vec of type (instruction, instruction_index)
pub fn get_secp_instructions(
    index_current_instruction: u16,
    necessary_instructions_count: usize,
    instruction_info: &AccountInfo,
) -> Result<Vec<(Instruction, u16)>, AudiusProgramError> {
    let mut secp_instructions: Vec<(Instruction, u16)> = Vec::new();

    for ind in 0..index_current_instruction {
        let instruction = sysvar::instructions::load_instruction_at(
            ind as usize,
            &instruction_info.data.borrow(),
        )
        .map_err(to_audius_program_error)?;

        if instruction.program_id == secp256k1_program::id() {
            secp_instructions.push((instruction, ind));
        }
    }

    if secp_instructions.len() != necessary_instructions_count {
        return Err(AudiusProgramError::Secp256InstructionMissing);
    }

    Ok(secp_instructions)
}

/// Returns the eth_addresses and operators associated with `signers`.
///
/// Ensures that there are no duplicate signers, that each signer
/// is owned by the program, and that each signer account can be derived
/// from it's known eth address.
pub fn get_and_verify_signer_metadata<'a>(
    program_id: &Pubkey,
    reward_manager_key: &Pubkey,
    signers: Vec<&AccountInfo<'a>>,
) -> Result<(Vec<EthereumAddress>, BTreeSet<EthereumAddress>), ProgramError> {
    let mut senders_eth_addresses: Vec<EthereumAddress> = Vec::new();
    let mut operators = BTreeSet::<EthereumAddress>::new();

    for signer in signers {
        let signer_data = SenderAccount::try_from_slice(&signer.data.borrow())?;
        if !signer_data.is_initialized() {
            return Err(ProgramError::UninitializedAccount);
        }

        assert_owned_by(signer, program_id)?;

        // Derive the Solana address corresponding to the
        // signer's eth address
        let (_, derived_signer, _) = find_derived_pair(
            program_id,
            reward_manager_key,
            [
                SENDER_SEED_PREFIX.as_ref(),
                signer_data.eth_address.as_ref(),
            ]
            .concat()
            .as_ref(),
        );

        if derived_signer != *signer.key {
            return Err(ProgramError::InvalidSeeds);
        }
        if senders_eth_addresses.contains(&signer_data.eth_address) {
            return Err(AudiusProgramError::RepeatedSenders.into());
        }
        if !operators.insert(signer_data.operator) {
            return Err(AudiusProgramError::OperatorCollision.into());
        }
        senders_eth_addresses.push(signer_data.eth_address);
    }

    Ok((senders_eth_addresses, operators))
}

/// Retrieves an eth signer from an secp instruction
pub fn get_signer_from_secp_instruction(secp_instruction_data: Vec<u8>) -> EthereumAddress {
    let eth_address_offset = 12;
    let instruction_signer =
        secp_instruction_data[eth_address_offset..eth_address_offset + 20].to_vec();
    let instruction_signer: EthereumAddress = instruction_signer.as_slice().try_into().unwrap();
    instruction_signer
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

pub const SIGNATURE_OFFSETS_SERIALIZED_SIZE: usize = 11;
pub const DATA_START: usize = SIGNATURE_OFFSETS_SERIALIZED_SIZE + 1;
// These messages are prefix (3) + reward_manager_pubkey (32) + eth_address (20) = 55
pub const EXPECTED_ADD_DELETE_MESSAGE_SIZE: u16 = 55;
// All vote messages are padded to 128 bytes
pub const VOTE_MESSAGE_LENGTH: u16 = 128;

/// Validates the secp offsets struct is as expected -
/// the *_index fields must point to the `instruction_index`,
/// the *_offset fields must be known sizes,
/// and the message len must match the `expected_message_size`.
pub fn validate_secp_offsets(
    secp_instruction_data: Vec<u8>,
    instruction_index: u8,
    expected_message_size: u16,
) -> ProgramResult {
    // First, ensure there is just a single offsets struct included
    if secp_instruction_data[0] != 1 {
        return Err(AudiusProgramError::SignatureVerificationFailed.into());
    }

    let start = 1;
    let end = start + SIGNATURE_OFFSETS_SERIALIZED_SIZE;
    let offsets = SecpSignatureOffsets::try_from_slice(&secp_instruction_data[start..end]).unwrap();
    // Ensure indices match current instruction
    let indices_match = offsets.signature_instruction_index == instruction_index
        && offsets.eth_address_instruction_index == instruction_index
        && offsets.message_instruction_index == instruction_index;

    if !indices_match {
        return Err(AudiusProgramError::SignatureVerificationFailed.into());
    }

    // Ensure offsets match expected values
    // eth_address_offset = DATA_START (12)
    if offsets.eth_address_offset != DATA_START as u16 {
        return Err(AudiusProgramError::SignatureVerificationFailed.into());
    }

    // signature_offset = DATA_START + eth_pubkey.len (20) = 32
    if offsets.signature_offset != 32 {
        return Err(AudiusProgramError::SignatureVerificationFailed.into());
    }

    // message_data_offset = signature_offset + signature_arr.len (65) = 97
    if offsets.message_data_offset != 97 {
        return Err(AudiusProgramError::SignatureVerificationFailed.into());
    }

    if offsets.message_data_size != expected_message_size {
        return Err(AudiusProgramError::SignatureVerificationFailed.into());
    }

    Ok(())
}

// meta (12) + address (20) + signature (65) = 97
const MESSAGE_DATA_OFFSET: usize = 97;

/// Assert that the message contained in `secp_instruction_data`
/// matches `expected_message`.
pub fn check_message_from_secp_instruction(
    secp_instruction_data: Vec<u8>,
    expected_message: &[u8],
) -> Result<(), ProgramError> {
    let message = secp_instruction_data[MESSAGE_DATA_OFFSET..].to_vec();
    if message != *expected_message {
        Err(AudiusProgramError::SignatureVerificationFailed.into())
    } else {
        Ok(())
    }
}

/// Attempts to parse out a `vote_message` from `secp_instruction_data`.
pub fn get_vote_message_from_secp_instruction(
    secp_instruction_data: Vec<u8>,
) -> Result<VoteMessage, ProgramError> {
    let mut message = secp_instruction_data[MESSAGE_DATA_OFFSET..].to_vec();

    while message.len() < 128 {
        message.push(0);
    }
    message
        .as_slice()
        .try_into()
        .map_err(|_| AudiusProgramError::SignatureVerificationFailed.into())
}

fn vec_into_checkmap(vec: &[EthereumAddress]) -> BTreeMap<EthereumAddress, bool> {
    let mut map = BTreeMap::new();
    for item in vec {
        map.insert(*item, false);
    }
    map
}

/// Assert that `eth_signer` is in check_map, but hasn't previously
/// been checked.
fn check_signer(
    checkmap: &mut BTreeMap<EthereumAddress, bool>,
    eth_signer: &EthereumAddress,
) -> ProgramResult {
    if let Some(val) = checkmap.get_mut(eth_signer) {
        if !*val {
            *val = true;
        } else {
            return Err(AudiusProgramError::SignCollision.into());
        }
    } else {
        return Err(AudiusProgramError::WrongSigner.into());
    }
    Ok(())
}

/// Validates secp instructions for add or delete sender instructions.
pub fn validate_secp_add_delete_sender(
    program_id: &Pubkey,
    reward_manager: &Pubkey,
    instruction_info: &AccountInfo,
    expected_signers: Vec<&AccountInfo>,
    extraction_depth: usize,
    new_sender: EthereumAddress,
    message_prefix: &str,
) -> ProgramResult {
    let index = sysvar::instructions::load_current_index(&instruction_info.data.borrow());
    // Instruction can't be first in transaction
    // because must follow after `new_secp256k1_instruction`
    if index == 0 {
        return Err(AudiusProgramError::Secp256InstructionMissing.into());
    }

    // Load previous instructions
    let secp_instructions = get_secp_instructions(index, extraction_depth, instruction_info)?;

    // Get the eth addresses associated with our expected_signers
    let (senders_eth_addresses, _) =
        get_and_verify_signer_metadata(program_id, reward_manager, expected_signers)?;

    let mut checkmap = vec_into_checkmap(&senders_eth_addresses);
    let expected_message = [
        message_prefix.as_ref(),
        reward_manager.as_ref(),
        new_sender.as_ref(),
    ]
    .concat();

    // For each secp instruction, assert that the signer was expected and not duplicated
    // and that the message is formatted correctly.
    for (secp_instruction, index) in secp_instructions {
        let eth_signer = get_signer_from_secp_instruction(secp_instruction.data.clone());
        check_signer(&mut checkmap, &eth_signer)?;
        validate_secp_offsets(
            secp_instruction.data.clone(),
            index as u8,
            EXPECTED_ADD_DELETE_MESSAGE_SIZE,
        )?;
        check_message_from_secp_instruction(
            secp_instruction.data.clone(),
            expected_message.as_ref(),
        )?;
    }

    Ok(())
}

/// Checks secp instruction for submit_attestation:
/// ensures the message is signed by `expected_signer`, and
/// returns the message.
pub fn validate_secp_submit_attestation(
    instruction_info: &AccountInfo,
    expected_signer: &EthereumAddress,
) -> Result<VoteMessage, ProgramError> {
    let index = sysvar::instructions::load_current_index(&instruction_info.data.borrow());

    // Instruction can't be first in transaction
    // because must follow after `new_secp256k1_instruction`
    if index == 0 {
        return Err(AudiusProgramError::Secp256InstructionMissing.into());
    }

    let secp_index = index - 1;
    // Load previous instruction
    let secp_instruction = sysvar::instructions::load_instruction_at(
        secp_index as usize,
        &instruction_info.data.borrow(),
    )
    .map_err(to_audius_program_error)?;

    // Check that instruction is `new_secp256k1_instruction`
    if secp_instruction.program_id != secp256k1_program::id() {
        return Err(AudiusProgramError::Secp256InstructionMissing.into());
    }

    validate_secp_offsets(secp_instruction.data.clone(), secp_index.try_into().unwrap(), VOTE_MESSAGE_LENGTH)?;

    let eth_signer = get_signer_from_secp_instruction(secp_instruction.data.clone());
    if eth_signer != *expected_signer {
        return Err(AudiusProgramError::WrongSigner.into());
    }

    get_vote_message_from_secp_instruction(secp_instruction.data)
}
