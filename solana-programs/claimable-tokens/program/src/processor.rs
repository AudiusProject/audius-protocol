//! Program state processor

use crate::{
    error::{to_claimable_tokens_error, ClaimableProgramError},
    instruction::ClaimableProgramInstruction,
    utils::program::{find_address_pair, EthereumAddress},
};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::next_account_info,
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    secp256k1_program, system_instruction, sysvar,
    sysvar::rent::Rent,
    sysvar::Sysvar,
};
use solana_sdk::{secp256k1_instruction::{SIGNATURE_OFFSETS_SERIALIZED_SIZE}};

use std::mem::size_of;

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


/// Program state handler.
pub struct Processor;

impl Processor {
    /// Initialize user bank
    #[allow(clippy::too_many_arguments)]
    pub fn process_init_instruction<'a>(
        program_id: &Pubkey,
        funder_account_info: &AccountInfo<'a>,
        mint_account_info: &AccountInfo<'a>,
        base_account_info: &AccountInfo<'a>,
        acc_to_create_info: &AccountInfo<'a>,
        rent_account_info: &AccountInfo<'a>,
        rent: &Rent,
        eth_address: EthereumAddress,
    ) -> ProgramResult {
        // check that mint is initialized
        spl_token::state::Mint::unpack(&mint_account_info.data.borrow())?;
        Self::create_account(
            program_id,
            funder_account_info.clone(),
            acc_to_create_info.clone(),
            mint_account_info.key,
            base_account_info.clone(),
            eth_address,
            rent.minimum_balance(spl_token::state::Account::LEN),
            spl_token::state::Account::LEN as u64,
        )?;

        Self::initialize_token_account(
            acc_to_create_info.clone(),
            mint_account_info.clone(),
            base_account_info.clone(),
            rent_account_info.clone(),
        )
    }

    /// Transfer user tokens
    /// Operation gated by SECP recovery
    pub fn process_transfer_instruction<'a>(
        program_id: &Pubkey,
        banks_token_account_info: &AccountInfo<'a>,
        destination_account_info: &AccountInfo<'a>,
        authority_account_info: &AccountInfo<'a>,
        instruction_info: &AccountInfo<'a>,
        eth_address: EthereumAddress,
        amount: u64,
    ) -> ProgramResult {
        Self::check_ethereum_sign(
            instruction_info,
            &eth_address,
            &destination_account_info.key.to_bytes(),
        )?;
        Self::token_transfer(
            banks_token_account_info.clone(),
            destination_account_info.clone(),
            authority_account_info.clone(),
            program_id,
            eth_address,
            amount,
        )
    }

    /// Processes an instruction
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        input: &[u8],
    ) -> ProgramResult {
        let instruction = ClaimableProgramInstruction::try_from_slice(input)?;
        let account_info_iter = &mut accounts.iter();
        match instruction {
            ClaimableProgramInstruction::CreateTokenAccount(eth_address) => {
                msg!("Instruction: CreateTokenAccount");

                let funder_account_info = next_account_info(account_info_iter)?;
                let mint_account_info = next_account_info(account_info_iter)?;
                let base_account_info = next_account_info(account_info_iter)?;
                let acc_to_create_info = next_account_info(account_info_iter)?;
                let rent_account_info = next_account_info(account_info_iter)?;
                let rent = &Rent::from_account_info(rent_account_info)?;

                Self::process_init_instruction(
                    program_id,
                    funder_account_info,
                    mint_account_info,
                    base_account_info,
                    acc_to_create_info,
                    rent_account_info,
                    rent,
                    eth_address.eth_address,
                )
            }
            ClaimableProgramInstruction::Transfer(instruction) => {
                msg!("Instruction: Transfer");

                let banks_token_account_info = next_account_info(account_info_iter)?;
                let destination_account_info = next_account_info(account_info_iter)?;
                let authority_account_info = next_account_info(account_info_iter)?;
                let instruction_info = next_account_info(account_info_iter)?;

                Self::process_transfer_instruction(
                    program_id,
                    banks_token_account_info,
                    destination_account_info,
                    authority_account_info,
                    instruction_info,
                    instruction.eth_address,
                    instruction.amount,
                )
            }
        }
    }

    // Helper functions below
    #[allow(clippy::too_many_arguments)]
    fn create_account<'a>(
        program_id: &Pubkey,
        funder: AccountInfo<'a>,
        account_to_create: AccountInfo<'a>,
        mint_key: &Pubkey,
        base: AccountInfo<'a>,
        eth_address: EthereumAddress,
        required_lamports: u64,
        space: u64,
    ) -> ProgramResult {
        // Calculate target bank account PDA
        let pair = find_address_pair(program_id, mint_key, eth_address)?;
        // Verify base and incoming account match expected
        if *base.key != pair.base.address {
            return Err(ProgramError::InvalidSeeds);
        }
        if *account_to_create.key != pair.derive.address {
            return Err(ProgramError::InvalidSeeds);
        }

        // Create user bank account signature and invoke from program
        let signature = &[&mint_key.to_bytes()[..32], &[pair.base.seed]];

        invoke_signed(
            &system_instruction::create_account_with_seed(
                funder.key,
                account_to_create.key,
                base.key,
                pair.derive.seed.as_str(),
                required_lamports,
                space,
                &spl_token::id(),
            ),
            &[funder.clone(), account_to_create.clone(), base.clone()],
            &[signature],
        )
    }

    /// Helper to initialize user token account
    fn initialize_token_account<'a>(
        account_to_initialize: AccountInfo<'a>,
        mint: AccountInfo<'a>,
        owner: AccountInfo<'a>,
        rent_account: AccountInfo<'a>,
    ) -> ProgramResult {
        invoke(
            &spl_token::instruction::initialize_account(
                &spl_token::id(),
                account_to_initialize.key,
                mint.key,
                owner.key,
            )?,
            &[account_to_initialize, mint, owner, rent_account],
        )
    }

    /// Transfer tokens from source to destination
    fn token_transfer<'a>(
        source: AccountInfo<'a>,
        destination: AccountInfo<'a>,
        authority: AccountInfo<'a>,
        program_id: &Pubkey,
        eth_address: EthereumAddress,
        amount: u64,
    ) -> Result<(), ProgramError> {
        let source_data = spl_token::state::Account::unpack(&source.data.borrow())?;

        // Verify source token account matches the expected PDA
        let pair = find_address_pair(program_id, &source_data.mint, eth_address)?;
        if *source.key != pair.derive.address {
            return Err(ProgramError::InvalidSeeds);
        }

        // Reject for zero or amount higher than available
        if amount == 0 || amount > source_data.amount {
            return Err(ProgramError::InsufficientFunds);
        }

        let authority_signature_seeds = [&source_data.mint.to_bytes()[..32], &[pair.base.seed]];
        let signers = &[&authority_signature_seeds[..]];

        invoke_signed(
            &spl_token::instruction::transfer(
                &spl_token::id(),
                source.key,
                destination.key,
                authority.key,
                &[authority.key],
                amount,
            )?,
            &[source, destination, authority],
            signers,
        )
    }

    /// Checks that the user signed message with his ethereum private key
    fn check_ethereum_sign(
        instruction_info: &AccountInfo,
        expected_signer: &EthereumAddress,
        expected_message: &[u8],
    ) -> ProgramResult {
        let index = sysvar::instructions::load_current_index(&instruction_info.data.borrow());

        // instruction can't be first in transaction
        // because must follow after `new_secp256k1_instruction`
        if index == 0 {
            return Err(ClaimableProgramError::Secp256InstructionLosing.into());
        }

        // load previous instruction
        let instruction = sysvar::instructions::load_instruction_at(
            (index - 1) as usize,
            &instruction_info.data.borrow(),
        )
        .map_err(to_claimable_tokens_error)?;

        // is that instruction is `new_secp256k1_instruction`
        if instruction.program_id != secp256k1_program::id() {
            return Err(ClaimableProgramError::Secp256InstructionLosing.into());
        }

        Self::validate_eth_signature(expected_signer, expected_message, instruction.data)
    }

    /// Checks that message inside instruction was signed by expected signer
    /// and message matches the expected value
    fn validate_eth_signature(
        expected_signer: &EthereumAddress,
        expected_message: &[u8],
        secp_instruction_data: Vec<u8>,
    ) -> Result<(), ProgramError> {
        if secp_instruction_data[0] != 1 {
            return Err(ClaimableProgramError::SignatureVerificationFailed.into());
        }
        let start = 1 * (SIGNATURE_OFFSETS_SERIALIZED_SIZE as usize);
        let end = start + (SIGNATURE_OFFSETS_SERIALIZED_SIZE as usize);
        let sig_offsets_struct = SecpSignatureOffsets::try_from_slice(
            &secp_instruction_data[start..end]
        )
            .map_err(|_| ClaimableProgramError::SignatureVerificationFailed)?;

        println!("sig_offsets_struct {:?}", sig_offsets_struct);

        let eth_address_offset = 12;
        let instruction_signer = secp_instruction_data
            [eth_address_offset..eth_address_offset + size_of::<EthereumAddress>()]
            .to_vec();
        if instruction_signer != expected_signer {
            return Err(ClaimableProgramError::SignatureVerificationFailed.into());
        }

        //NOTE: meta (12) + address (20) + signature (65) = 97
        let message_data_offset = 97;
        let instruction_message = secp_instruction_data[message_data_offset..].to_vec();
        if instruction_message != *expected_message {
            return Err(ClaimableProgramError::SignatureVerificationFailed.into());
        }

        Ok(())
    }
}

// #[cfg(test)]
// mod tests {
//     use crate::processor::Processor;
//     // use libsecp256k1::{SecretKey};
//     use solana_program::{instruction::Instruction, pubkey::Pubkey, secp256k1_program};
//     use solana_sdk::{secp256k1_instruction::{self, SecpSignatureOffsets, construct_eth_pubkey}, transaction::Transaction};
//     // use sha3::Digest;
 
//     #[test]
//     fn test_eth_validation_bug() {
//         let fake_sk = libsecp256k1::SecretKey::random(&mut rand_073::thread_rng());
//         let fake_pk = libsecp256k1::PublicKey::from_secret_key(&fake_sk);
//         // Don't need the real secret key
//         let real_pk = libsecp256k1::PublicKey::from_secret_key(&libsecp256k1::SecretKey::random(&mut rand_073::thread_rng()));

//         let fake_msg: Vec<u8> = (0..100).collect();
//         let real_msg: Vec<u8> = (50..150).collect();
//         let real_eth_pubkey = construct_eth_pubkey(&real_pk);
//         let fake_eth_pubkey = construct_eth_pubkey(&fake_pk);

//         let mut hasher = sha3::Keccak256::new();
//         hasher.update(fake_msg.clone());
//         let fake_message_hash = hasher.finalize();
//         let mut fake_message_hash_arr = [0u8; 32];
//         fake_message_hash_arr.copy_from_slice(&fake_message_hash.as_slice());
//         let fake_message = libsecp256k1::Message::parse(&fake_message_hash_arr);
//         let (fake_signature, fake_recovery_id) = libsecp256k1::sign(&fake_message, &fake_sk);
//         let fake_signature_arr = fake_signature.serialize();

//         let mut dummy_instr_data = vec![];
//         let eth_addr_offset = dummy_instr_data.len();
//         dummy_instr_data.extend_from_slice(&fake_eth_pubkey);
//         let eth_sig_offset = dummy_instr_data.len(); 
//         dummy_instr_data.extend_from_slice(&fake_signature_arr);
//         dummy_instr_data.push(fake_recovery_id.serialize());
//         let msg_offset = dummy_instr_data.len();
//         dummy_instr_data.append(&mut fake_msg.clone());

//         let dummy_instr_data_ind = 0;

//         let secp_offsets_struct = SecpSignatureOffsets {
//             eth_address_instruction_index: dummy_instr_data_ind,
//             message_instruction_index: dummy_instr_data_ind,
//             signature_instruction_index: dummy_instr_data_ind,
//             eth_address_offset: eth_addr_offset as u16,
//             message_data_offset: msg_offset as u16,
//             message_data_size: fake_msg.len() as u16,
//             signature_offset: eth_sig_offset as u16,
//         };
//         println!(
//             "SECP TEST OFFSET {:?}",
//             secp_offsets_struct
//         );

//         let mut secp_instr_data = vec![];
//         secp_instr_data.push(1u8); // count
//         secp_instr_data.append(&mut bincode::serialize(&secp_offsets_struct).unwrap());
//         // Here's where we put the real pubkey, which our processor tries to validate
//         secp_instr_data.extend_from_slice(&real_eth_pubkey);
//         // Append dummy signature data
//         let mut dummy_sig = (0..65).collect();
//         println!("{:?} = dummy sig", dummy_sig);
//         secp_instr_data.append(&mut dummy_sig);
//         // Append the real message
//         secp_instr_data.append(&mut real_msg.clone());

//         let dummy_instruction = Instruction {
//             program_id: Pubkey::new_unique(),
//             accounts: vec![],
//             data: dummy_instr_data.clone(),
//         };

//         let secp_instruction = Instruction {
//             program_id: secp256k1_program::id(),
//             accounts: vec![],
//             data: secp_instr_data.clone(),
//         };
        
//         let tx = Transaction::new_with_payer(&[dummy_instruction, secp_instruction], None);
//         assert!(tx.verify_precompiles(false).is_ok());
//         assert!(Processor::validate_eth_signature(&real_eth_pubkey, &real_msg, secp_instr_data.clone()).is_ok());
//     }
// }