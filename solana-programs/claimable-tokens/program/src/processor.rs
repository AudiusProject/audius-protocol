//! Program state processor

use crate::{
    error::{to_claimable_tokens_error, ClaimableProgramError},
    instruction::ClaimableProgramInstruction,
    state::{NonceAccount, TransferInstructionData},
    utils::program::{
        find_address_pair, find_nonce_address, find_rent_receiver_address, EthereumAddress, NONCE_ACCOUNT_PREFIX, get_rent_receiver_seed
    },
};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
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
use std::str::FromStr;
use std::convert::TryInto;

/// Pubkey length
pub const PUBKEY_LENGTH: usize = 32;

/// Known const for serialized signature offsets
pub const SIGNATURE_OFFSETS_SERIALIZED_SIZE: usize = 11;

/// Start of SECP recovery data after serialized SecpSignatureOffsets struct
pub const DATA_START: usize = SIGNATURE_OFFSETS_SERIALIZED_SIZE + 1;

/// Default rent receiver for closing token accounts
/// Prod/stage: 2HYDf9XvHRKhquxK1z4ETJ8ywueZcqEazyFZdRfLqGcT
pub const DEFAULT_RENT_RECEIVER: &str = "2HYDf9XvHRKhquxK1z4ETJ8ywueZcqEazyFZdRfLqGcT";

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
        Self::create_token_account(
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

    /// Initialize user bank with rent receiver
    #[allow(clippy::too_many_arguments)]
    pub fn process_init_v2_instruction<'a>(
        program_id: &Pubkey,
        funder_account_info: &AccountInfo<'a>,
        rent_receiver_account_info: &AccountInfo<'a>,
        mint_account_info: &AccountInfo<'a>,
        base_account_info: &AccountInfo<'a>,
        acc_to_create_info: &AccountInfo<'a>,
        rent_account_info: &AccountInfo<'a>,
        rent: &Rent,
        eth_address: EthereumAddress,
        rent_receiver: Pubkey,
    ) -> ProgramResult {
        // check that mint is initialized
        spl_token::state::Mint::unpack(&mint_account_info.data.borrow())?;
        Self::create_token_account(
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
        )?;

        Self::initialize_rent_receiver(
            program_id,
            mint_account_info,
            funder_account_info,
            base_account_info,
            rent_receiver_account_info.clone(),
            eth_address,
            rent_receiver,
            rent,
        )
    }

    /// Transfer user tokens
    /// Operation gated by SECP recovery
    pub fn process_transfer_instruction<'a>(
        program_id: &Pubkey,
        rent: &Rent,
        funder_account_info: &AccountInfo<'a>,
        banks_token_account_info: &AccountInfo<'a>,
        destination_account_info: &AccountInfo<'a>,
        nonce_account_info: &AccountInfo<'a>,
        authority_account_info: &AccountInfo<'a>,
        instruction_info: &AccountInfo<'a>,
        eth_address: EthereumAddress,
    ) -> ProgramResult {
        let signed_amount = Self::check_ethereum_sign(
            program_id,
            funder_account_info,
            instruction_info,
            banks_token_account_info,
            nonce_account_info,
            authority_account_info,
            &eth_address,
            &destination_account_info.key.to_bytes(),
            rent,
        )?;
        Self::token_transfer(
            banks_token_account_info.clone(),
            destination_account_info.clone(),
            authority_account_info.clone(),
            program_id,
            eth_address,
            signed_amount,
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
            ClaimableProgramInstruction::CreateTokenAccountV2(data) => {
                msg!("Instruction: CreateTokenAccount");

                let funder_account_info = next_account_info(account_info_iter)?;
                let rent_receiver_account_info = next_account_info(account_info_iter)?;
                let mint_account_info = next_account_info(account_info_iter)?;
                let base_account_info = next_account_info(account_info_iter)?;
                let acc_to_create_info = next_account_info(account_info_iter)?;
                let rent_account_info = next_account_info(account_info_iter)?;
                let rent = &Rent::from_account_info(rent_account_info)?;

                Self::process_init_v2_instruction(
                    program_id,
                    funder_account_info,
                    rent_receiver_account_info,
                    mint_account_info,
                    base_account_info,
                    acc_to_create_info,
                    rent_account_info,
                    rent,
                    data.eth_address,
                    data.rent_receiver,
                )
            }
            ClaimableProgramInstruction::Transfer(eth_address, ) => {
                msg!("Instruction: Transfer");

                let funder_account_info = next_account_info(account_info_iter)?;
                let banks_token_account_info = next_account_info(account_info_iter)?;
                let destination_account_info = next_account_info(account_info_iter)?;
                let nonce_account_info = next_account_info(account_info_iter)?;
                let authority_account_info = next_account_info(account_info_iter)?;
                let rent_account_info = next_account_info(account_info_iter)?;
                let rent = &Rent::from_account_info(rent_account_info)?;
                let instruction_info = next_account_info(account_info_iter)?;
                Self::process_transfer_instruction(
                    program_id,
                    rent,
                    funder_account_info,
                    banks_token_account_info,
                    destination_account_info,
                    nonce_account_info,
                    authority_account_info,
                    instruction_info,
                    eth_address,
                )
            }
            ClaimableProgramInstruction::CloseTokenAccount(eth_address) => {
                msg!("Instruction: CloseTokenAccount");
                let receiver_account_info = next_account_info(account_info_iter)?;
                let token_account_info = next_account_info(account_info_iter)?;
                let authority_account_info = next_account_info(account_info_iter)?;
                let rent_receiver_account_info = next_account_info(account_info_iter)?;
                Self::close(
                    program_id,
                    receiver_account_info.clone(),
                    token_account_info.clone(),
                    authority_account_info.clone(),
                    rent_receiver_account_info.clone(),
                    eth_address,
                )
            }
        }
    }

    // Helper functions below
    #[allow(clippy::too_many_arguments)]
    fn create_token_account<'a>(
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

        let account_to_create_lamports = account_to_create.lamports();
        let required_lamports_remaining =
            required_lamports.saturating_sub(account_to_create_lamports);

        // Transfer required lamports from payer to account to create if necessary.
        if required_lamports_remaining > 0 {
            invoke(
                &system_instruction::transfer(
                    funder.key,
                    account_to_create.key,
                    required_lamports_remaining,
                ),
                &[funder.clone(), account_to_create.clone()],
            )?;
        }

        invoke_signed(
            &system_instruction::allocate_with_seed(
                account_to_create.key,
                base.key,
                pair.derive.seed.as_str(),
                space,
                &spl_token::id(),
            ),
            &[account_to_create.clone(), base.clone()],
            &[signature],
        )?;
        invoke_signed(
            &system_instruction::assign_with_seed(
                account_to_create.key,
                base.key,
                pair.derive.seed.as_str(),
                &spl_token::id(),
            ),
            &[account_to_create.clone(), base.clone()],
            &[signature],
        )?;

        Ok(())
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

    fn initialize_rent_receiver<'a>(
        program_id: &Pubkey,
        mint_account_info: &AccountInfo<'a>,
        funder_account_info: &AccountInfo<'a>,
        authority_account_info: &AccountInfo<'a>,
        rent_receiver_account: AccountInfo<'a>,
        eth_address: EthereumAddress,
        rent_receiver: Pubkey,
        rent: &Rent
    ) -> ProgramResult {
        // Initialize rent receiver account
        let rent_receiver_seed = get_rent_receiver_seed(&eth_address);
        let (base_address, derived_rent_receiver_address, bump_seed) =
            find_rent_receiver_address(program_id, &mint_account_info.key, &eth_address);


        if derived_rent_receiver_address != *rent_receiver_account.key {
            msg!("Invalid rent receiver PDA address");
            return Err(ClaimableProgramError::InvalidRentReceiver.into());
        }
        if base_address != *authority_account_info.key {
            msg!("Invalid authority account for rent receiver");
            return Err(ClaimableProgramError::InvalidRentReceiver.into());
        }

        let signers_seeds = &[
            &authority_account_info.key.to_bytes()[..32],
            &rent_receiver_seed.as_slice(),
            &[bump_seed],
        ];

        // Calculate if additional lamports are required to store nonce
        // just in case someone is trying to deny this nonce from being used.
        let rent_receiver_acct_lamports = rent_receiver_account.lamports();
        let required_lamports = rent
            .minimum_balance(PUBKEY_LENGTH)
            .saturating_sub(rent_receiver_acct_lamports);

        // Transfer required lamports from payer to nonce account if necessary.
        if required_lamports > 0 {
            invoke(
                &system_instruction::transfer(
                    funder_account_info.key,
                    rent_receiver_account.key,
                    required_lamports,
                ),
                &[funder_account_info.clone(), rent_receiver_account.clone()],
            )?;
        }

        // If the rent receiver account is empty / doesn't exist yet, create it.
        let rent_receiver_acct_is_empty = rent_receiver_account.try_data_is_empty().unwrap_or(true);
        if rent_receiver_acct_is_empty {
            invoke_signed(
                &system_instruction::allocate(rent_receiver_account.key, PUBKEY_LENGTH as u64),
                &[rent_receiver_account.clone()],
                &[signers_seeds],
            )?;

            invoke_signed(
                &system_instruction::assign(rent_receiver_account.key, program_id),
                &[rent_receiver_account.clone()],
                &[signers_seeds],
            )?;
        }

        // Copy the rent receiver address into the account data
        rent_receiver_account.data.borrow_mut()[..PUBKEY_LENGTH]
            .copy_from_slice(rent_receiver.as_ref());
        Ok(())
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

    /// Closes token account and transfers rent to receiver
    fn close<'a>(
        program_id: &Pubkey,
        receiver_account_info: AccountInfo<'a>,
        token_account_info: AccountInfo<'a>,
        authority_account_info: AccountInfo<'a>,
        rent_receiver_account_info: AccountInfo<'a>,
        eth_address: EthereumAddress,
    ) -> ProgramResult {
        let token_account_data = spl_token::state::Account::unpack(&token_account_info.data.borrow())?;       
        let pair = find_address_pair(program_id, &token_account_data.mint, eth_address)?;

        // Validate the token account matches expected PDA
        if *token_account_info.key != pair.derive.address {
            return Err(ProgramError::InvalidSeeds);
        }

        let expected_receiver_account_pda = find_rent_receiver_address(
            program_id,
            &token_account_data.mint,
            &eth_address,
        ).1;
        if expected_receiver_account_pda != *rent_receiver_account_info.key {
            msg!("Invalid rent receiver PDA address {} != {}", *rent_receiver_account_info.key, expected_receiver_account_pda);
            return Err(ClaimableProgramError::InvalidRentReceiver.into());
        }

        let rent_receiver_account_data = &rent_receiver_account_info.data.borrow();
        let default_receiver = Pubkey::from_str(DEFAULT_RENT_RECEIVER).unwrap();
        if rent_receiver_account_data.len() >= PUBKEY_LENGTH {
            let stored_pubkey = Pubkey::new_from_array(
                rent_receiver_account_data[..PUBKEY_LENGTH].try_into().map_err(|_| ClaimableProgramError::InvalidRentReceiver)?
            );
            if stored_pubkey != *receiver_account_info.key {
                msg!("Rent receiver account data does not match expected address {} != {}", *receiver_account_info.key, stored_pubkey);
                return Err(ClaimableProgramError::InvalidRentReceiver.into());
            }
        } else if  *receiver_account_info.key != default_receiver {
            msg!("Rent receiver account does not match default receiver {} != {}", *receiver_account_info.key, default_receiver);
            return Err(ClaimableProgramError::InvalidRentReceiver.into());
        }
        
        let authority_signature_seeds = [&token_account_data.mint.to_bytes()[..32], &[pair.base.seed]];
        let signers = &[&authority_signature_seeds[..]];

        // Close token account and transfer rent to receiver
        invoke_signed(
            &spl_token::instruction::close_account(
                &spl_token::id(),
                token_account_info.key,
                receiver_account_info.key,
                authority_account_info.key,
                &[],
            )?,
            &[token_account_info, receiver_account_info, authority_account_info],
            signers,
        )
    }

    /// Checks that the user signed message with his ethereum private key
    fn check_ethereum_sign<'a>(
        program_id: &Pubkey,
        funder_account_info: &AccountInfo<'a>,
        instruction_info: &AccountInfo<'a>,
        banks_token_account_info: &AccountInfo<'a>,
        nonce_account_info: &AccountInfo<'a>,
        authority: &AccountInfo<'a>,
        expected_signer: &EthereumAddress,
        expected_message: &[u8],
        rent: &Rent,
    ) -> Result<u64, ProgramError> {
        let index = sysvar::instructions::load_current_index_checked(&instruction_info)
            .map_err(to_claimable_tokens_error)?;

        // instruction can't be first in transaction
        // because must follow after `new_secp256k1_instruction`
        if index == 0 {
            return Err(ClaimableProgramError::Secp256InstructionLosing.into());
        }

        // Current instruction - 1
        let secp_program_index = index - 1;

        // load previous instruction
        let instruction = sysvar::instructions::load_instruction_at_checked(
            secp_program_index as usize,
            &instruction_info,
        )
        .map_err(to_claimable_tokens_error)?;

        // is that instruction is `new_secp256k1_instruction`
        if instruction.program_id != secp256k1_program::id() {
            return Err(ClaimableProgramError::Secp256InstructionLosing.into());
        }

        let transfer_data = Self::validate_eth_signature(
            expected_signer,
            expected_message,
            instruction.data,
            secp_program_index as u8,
        )?;

        let token_account_info =
            spl_token::state::Account::unpack(&banks_token_account_info.data.borrow())?;

        let nonce_acct_seed = [NONCE_ACCOUNT_PREFIX.as_ref(), expected_signer.as_ref()].concat();
        let (base_address, derived_nonce_address, bump_seed) =
            find_nonce_address(program_id, &token_account_info.mint, &nonce_acct_seed);

        if derived_nonce_address != *nonce_account_info.key {
            return Err(ClaimableProgramError::Secp256InstructionLosing.into());
        }
        if base_address != *authority.key {
            return Err(ClaimableProgramError::Secp256InstructionLosing.into());
        }

        let signers_seeds = &[
            &authority.key.to_bytes()[..32],
            &nonce_acct_seed.as_slice(),
            &[bump_seed],
        ];

        // Calculate if additional lamports are required to store nonce
        // just in case someone is trying to deny this nonce from being used.
        let nonce_acct_lamports = nonce_account_info.lamports();
        let required_lamports = rent
            .minimum_balance(NonceAccount::LEN)
            .saturating_sub(nonce_acct_lamports);

        // Transfer required lamports from payer to nonce account if necessary.
        if required_lamports > 0 {
            invoke(
                &system_instruction::transfer(
                    funder_account_info.key,
                    nonce_account_info.key,
                    required_lamports,
                ),
                &[funder_account_info.clone(), nonce_account_info.clone()],
            )?;
        }

        let mut current_nonce_account: NonceAccount;
        let mut current_chain_nonce = 0;

        // If the nonce account is empty / doesn't exist yet, create it.
        let nonce_acct_is_empty = nonce_account_info.try_data_is_empty().unwrap_or(true);
        if nonce_acct_is_empty {
            invoke_signed(
                &system_instruction::allocate(nonce_account_info.key, NonceAccount::LEN as u64),
                &[nonce_account_info.clone()],
                &[signers_seeds],
            )?;

            invoke_signed(
                &system_instruction::assign(nonce_account_info.key, program_id),
                &[nonce_account_info.clone()],
                &[signers_seeds],
            )?;

            current_nonce_account = NonceAccount::new();
        } else {
            // Fetch current nonce account and nonce value
            current_nonce_account = NonceAccount::unpack(&nonce_account_info.data.borrow())?;
            current_chain_nonce = current_nonce_account.nonce;
        }

        // Error if invalid nonce provided by user
        if transfer_data.nonce != current_chain_nonce {
            return Err(ClaimableProgramError::NonceVerificationError.into());
        }

        current_nonce_account.nonce += 1;
        NonceAccount::pack(current_nonce_account, *nonce_account_info.data.borrow_mut())?;

        Ok(transfer_data.amount)
    }

    /// Checks that message inside instruction was signed by expected signer
    /// and message matches the expected value
    /// Returns the TransferInstructionData object that was signed by the submitter
    /// Includes the amount, target, and nonce
    fn validate_eth_signature(
        expected_signer: &EthereumAddress,
        expected_message: &[u8],
        secp_instruction_data: Vec<u8>,
        instruction_index: u8,
    ) -> Result<TransferInstructionData, ProgramError> {
        // Only single recovery expected
        if secp_instruction_data[0] != 1 {
            return Err(ClaimableProgramError::SignatureVerificationFailed.into());
        }

        // Assert instruction_index = 1
        let start = 1;
        let end = start + (SIGNATURE_OFFSETS_SERIALIZED_SIZE as usize);
        let sig_offsets_struct =
            SecpSignatureOffsets::try_from_slice(&secp_instruction_data[start..end])
                .map_err(|_| ClaimableProgramError::SignatureVerificationFailed)?;

        let eth_address_offset = 12;
        // signature_offset = eth_address_offset (12) + eth_pubkey.len (20) = 32
        let signature_offset = 32;
        // eth_address_offset (12) + address (20) + signature (65) = 97
        let message_data_offset = 97;

        // Validate the index of this instruction matches expected value
        if sig_offsets_struct.message_instruction_index != instruction_index
            || sig_offsets_struct.signature_instruction_index != instruction_index
            || sig_offsets_struct.eth_address_instruction_index != instruction_index
        {
            return Err(ClaimableProgramError::SignatureVerificationFailed.into());
        }

        // Validate each offset is as expected
        if sig_offsets_struct.eth_address_offset != (eth_address_offset as u16)
            || sig_offsets_struct.signature_offset != (signature_offset as u16)
            || sig_offsets_struct.message_data_offset != (message_data_offset as u16)
        {
            return Err(ClaimableProgramError::SignatureVerificationFailed.into());
        }

        let instruction_signer = secp_instruction_data
            [eth_address_offset..eth_address_offset + size_of::<EthereumAddress>()]
            .to_vec();
        if instruction_signer != expected_signer {
            return Err(ClaimableProgramError::SignatureVerificationFailed.into());
        }

        let instruction_message = secp_instruction_data[message_data_offset..].to_vec();
        let decoded_instr_data =
            TransferInstructionData::try_from_slice(&instruction_message).unwrap();

        if decoded_instr_data.target_pubkey.to_bytes() != *expected_message {
            return Err(ClaimableProgramError::SignatureVerificationFailed.into());
        }

        Ok(decoded_instr_data)
    }
}
