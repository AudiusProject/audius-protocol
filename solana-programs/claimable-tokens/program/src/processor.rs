//! Program state processor

use crate::{
    error::{to_claimable_tokens_error, ClaimableProgramError},
    instruction::ClaimableProgramInstruction,
    utils::program::{
        get_address_pair,
        EthereumAddress
    }
};
use borsh::BorshDeserialize;
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
use std::mem::size_of;

/// Program state handler.
pub struct Processor;

impl Processor {
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
        let pair = get_address_pair(program_id, mint_key, eth_address)?;
        // Verify base and incoming account match expected
        if *base.key != pair.base.address {
            return Err(ProgramError::InvalidSeeds);
        }
        if *account_to_create.key != pair.derive.address {
            return Err(ProgramError::InvalidSeeds);
        }

        let signature = &[&mint_key.to_bytes()[..32], &[pair.base.seed]];

        invoke_signed(
            &system_instruction::create_account_with_seed(
                &funder.key,
                &account_to_create.key,
                &base.key,
                pair.derive.seed.as_str(),
                required_lamports,
                space,
                &spl_token::id(),
            ),
            &[funder.clone(), account_to_create.clone(), base.clone()],
            &[signature],
        )
    }

    fn initialize_token_account<'a>(
        account_to_initialize: AccountInfo<'a>,
        mint: AccountInfo<'a>,
        owner: AccountInfo<'a>,
        rent_account: AccountInfo<'a>,
    ) -> ProgramResult {
        invoke(
            &spl_token::instruction::initialize_account(
                &spl_token::id(),
                &account_to_initialize.key,
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
        let pair = get_address_pair(program_id, &source_data.mint, eth_address)?;
        if *source.key != pair.derive.address {
            return Err(ProgramError::InvalidSeeds);
        }

        let authority_signature_seeds = [&source_data.mint.to_bytes()[..32], &[pair.base.seed]];
        let signers = &[&authority_signature_seeds[..]];

        invoke_signed(
            &spl_token::instruction::transfer(
                &spl_token::id(),
                source.key,
                destination.key,
                authority.key,
                &[&authority.key],
                amount,
            )?,
            &[source, destination, authority],
            signers,
        )
    }

    /// Checks that message inside instruction was signed by expected signer
    /// and it expected message
    fn validate_eth_signature(
        expected_signer: &EthereumAddress,
        expected_message: &[u8],
        secp_instruction_data: Vec<u8>,
    ) -> Result<(), ProgramError> {
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

    /// Claim user tokens
    pub fn process_claim_instruction<'a>(
        program_id: &Pubkey,
        banks_token_account_info: &AccountInfo<'a>,
        destination_account_info: &AccountInfo<'a>,
        authority_account_info: &AccountInfo<'a>,
        instruction_info: &AccountInfo<'a>,
        eth_address: EthereumAddress,
        amount: u64,
    ) -> ProgramResult {

        // Confirmation of ownership
        // assert_owned_by(
        //     banks_token_account_info,
        //     program_id
        // )?;
        msg!("program id: {:?}", &program_id);
        msg!("banks token : {:?}", &banks_token_account_info);
        msg!("banks token owner : {:?}", &banks_token_account_info);
        msg!("authority : {:?}", &authority_account_info);

        Self::check_ethereum_sign(
            &instruction_info,
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
            ClaimableProgramInstruction::Claim(instruction) => {
                msg!("Instruction: Claim");

                let banks_token_account_info = next_account_info(account_info_iter)?;
                let destination_account_info = next_account_info(account_info_iter)?;
                let authority_account_info = next_account_info(account_info_iter)?;
                let instruction_info = next_account_info(account_info_iter)?;

                Self::process_claim_instruction(
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
}
