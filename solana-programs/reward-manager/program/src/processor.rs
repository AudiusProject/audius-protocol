//! Program state processor

use crate::{
    error::AudiusProgramError,
    instruction::{
        AddSenderArgs, CreateSenderArgs, InitRewardManagerArgs, Instructions, TransferArgs,
        SubmitAttestationsArgs,
    },
    state::{
        RewardManager, SenderAccount, VerifiedMessage, VerifiedMessages, ADD_SENDER_MESSAGE_PREFIX,
        DELETE_SENDER_MESSAGE_PREFIX,
    },
    utils::*,
};
use borsh::BorshDeserialize;
use solana_program::{
    account_info::next_account_info,
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
};

/// Sender program account seed
pub const SENDER_SEED_PREFIX: &str = "S_";
/// Transfer program account seed
pub const TRANSFER_SEED_PREFIX: &str = "T_";
/// Verify transfer program account seed
pub const VERIFY_TRANSFER_SEED_PREFIX: &str = "V_";
/// Transfer account space
pub const TRANSFER_ACC_SPACE: usize = 0;

/// Program state handler.
pub struct Processor;

impl Processor {
    /// Transfer all the SOL from source to receiver
    pub fn transfer_all(source: &AccountInfo, receiver: &AccountInfo) -> Result<(), ProgramError> {
        let mut from = source.try_borrow_mut_lamports()?;
        let mut to = receiver.try_borrow_mut_lamports()?;
        **to += **from;
        **from = 0;
        Ok(())
    }

    /// Process example instruction
    #[allow(clippy::too_many_arguments)]
    fn process_init_instruction<'a>(
        program_id: &Pubkey,
        reward_manager_info: &AccountInfo<'a>,
        token_account_info: &AccountInfo<'a>,
        mint_info: &AccountInfo<'a>,
        manager_info: &AccountInfo<'a>,
        authority_info: &AccountInfo<'a>,
        _spl_token_info: &AccountInfo<'a>,
        rent: &AccountInfo<'a>,
        min_votes: u8,
    ) -> ProgramResult {
        assert_owned_by(reward_manager_info, program_id)?;

        let mut reward_manager =
            RewardManager::unpack_unchecked(&reward_manager_info.data.borrow())?;
        assert_uninitialized(&reward_manager)?;

        let (reward_manager_authority, _) =
            find_program_address(program_id, reward_manager_info.key);
        if reward_manager_authority != *authority_info.key {
            return Err(ProgramError::InvalidAccountData);
        }

        spl_initialize_account(
            token_account_info.clone(),
            mint_info.clone(),
            authority_info.clone(),
            rent.clone(),
        )?;

        reward_manager = RewardManager::new(*token_account_info.key, *manager_info.key, min_votes);
        RewardManager::pack(reward_manager, *reward_manager_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_change_reward_manager_authority<'a>(
        reward_manager_info: &AccountInfo<'a>,
        current_authority_info: &AccountInfo<'a>,
        new_authority_info: &AccountInfo<'a>,
    ) -> ProgramResult {
        if !current_authority_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let mut reward_manager = RewardManager::unpack(&reward_manager_info.data.borrow())?;
        assert_account_key(current_authority_info, &reward_manager.manager)?;

        reward_manager.manager = *new_authority_info.key;

        RewardManager::pack(reward_manager, *reward_manager_info.data.borrow_mut())?;

        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    fn process_create_sender<'a>(
        program_id: &Pubkey,
        eth_address: EthereumAddress,
        operator: EthereumAddress,
        reward_manager_info: &AccountInfo<'a>,
        manager_account_info: &AccountInfo<'a>,
        authority_info: &AccountInfo<'a>,
        funder_account_info: &AccountInfo<'a>,
        sender_info: &AccountInfo<'a>,
        _sys_prog_info: &AccountInfo<'a>,
        rent_info: &AccountInfo<'a>,
    ) -> ProgramResult {
        if !manager_account_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        assert_owned_by(reward_manager_info, program_id)?;

        let reward_manager = RewardManager::unpack(&reward_manager_info.data.borrow())?;
        assert_account_key(manager_account_info, &reward_manager.manager)?;

        let derived_seed = [SENDER_SEED_PREFIX.as_ref(), eth_address.as_ref()].concat();
        let (reward_manager_authority, derived_address, bump_seed) =
            find_derived_pair(program_id, reward_manager_info.key, derived_seed.as_ref());

        assert_account_key(authority_info, &reward_manager_authority)?;
        assert_account_key(sender_info, &derived_address)?;

        let signers_seeds = &[
            &reward_manager_authority.to_bytes()[..32],
            &derived_seed.as_slice(),
            &[bump_seed],
        ];

        let rent = Rent::from_account_info(rent_info)?;
        create_account(
            program_id,
            funder_account_info.clone(),
            sender_info.clone(),
            SenderAccount::LEN,
            &[signers_seeds],
            &rent,
        )?;

        let sender_account = SenderAccount::new(*reward_manager_info.key, eth_address, operator);
        SenderAccount::pack(sender_account, *sender_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_delete_sender<'a>(
        program_id: &Pubkey,
        reward_manager_info: &AccountInfo<'a>,
        manager_account_info: &AccountInfo<'a>,
        sender_info: &AccountInfo<'a>,
        refunder_account_info: &AccountInfo<'a>,
        _sys_prog: &AccountInfo<'a>,
    ) -> ProgramResult {
        if !manager_account_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        assert_owned_by(reward_manager_info, program_id)?;
        assert_owned_by(sender_info, program_id)?;

        let reward_manager = RewardManager::unpack(&reward_manager_info.data.borrow())?;
        assert_account_key(manager_account_info, &reward_manager.manager)?;

        let sender_account = SenderAccount::unpack(&sender_info.data.borrow())?;
        assert_account_key(reward_manager_info, &sender_account.reward_manager)?;

        Self::transfer_all(sender_info, refunder_account_info)?;

        Ok(())
    }

    fn process_delete_sender_public<'a>(
        program_id: &Pubkey,
        reward_manager_info: &AccountInfo<'a>,
        sender_info: &AccountInfo<'a>,
        refunder_info: &AccountInfo<'a>,
        signers_info: Vec<&AccountInfo>,
        instructions_info: &AccountInfo<'a>,
    ) -> ProgramResult {
        assert_owned_by(reward_manager_info, program_id)?;
        assert_owned_by(sender_info, program_id)?;

        let reward_manager = RewardManager::unpack(&reward_manager_info.data.borrow())?;
        let sender_account = SenderAccount::unpack(&sender_info.data.borrow())?;

        if signers_info.len() < reward_manager.min_votes.into() {
            return Err(AudiusProgramError::NotEnoughSigners.into());
        }

        check_secp_instructions(
            program_id,
            reward_manager_info.key,
            instructions_info,
            signers_info.clone(),
            signers_info.len(),
            sender_account.eth_address,
            DELETE_SENDER_MESSAGE_PREFIX,
        )?;

        assert_account_key(reward_manager_info, &sender_account.reward_manager)?;

        Self::transfer_all(sender_info, refunder_info)?;

        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    fn process_create_sender_public<'a>(
        program_id: &Pubkey,
        reward_manager_info: &AccountInfo<'a>,
        authority_info: &AccountInfo<'a>,
        funder_info: &AccountInfo<'a>,
        new_sender_info: &AccountInfo<'a>,
        instructions_info: &AccountInfo<'a>,
        rent_info: &AccountInfo<'a>,
        signers_info: Vec<&AccountInfo>,
        eth_address: EthereumAddress,
        operator: EthereumAddress,
    ) -> ProgramResult {
        assert_owned_by(reward_manager_info, program_id)?;

        let reward_manager = RewardManager::unpack(&reward_manager_info.data.borrow())?;
        if signers_info.len() < reward_manager.min_votes.into() {
            return Err(AudiusProgramError::NotEnoughSigners.into());
        }

        check_secp_instructions(
            program_id,
            reward_manager_info.key,
            instructions_info,
            signers_info.clone(),
            signers_info.len(),
            eth_address,
            ADD_SENDER_MESSAGE_PREFIX,
        )?;

        let derived_seed = [SENDER_SEED_PREFIX.as_ref(), eth_address.as_ref()].concat();
        let (reward_manager_authority, derived_address, bump_seed) =
            find_derived_pair(program_id, reward_manager_info.key, derived_seed.as_ref());

        assert_account_key(authority_info, &reward_manager_authority)?;
        assert_account_key(new_sender_info, &derived_address)?;

        let signers_seeds = &[
            &reward_manager_authority.to_bytes()[..32],
            &derived_seed.as_slice(),
            &[bump_seed],
        ];

        let rent = Rent::from_account_info(rent_info)?;
        create_account(
            program_id,
            funder_info.clone(),
            new_sender_info.clone(),
            SenderAccount::LEN,
            &[signers_seeds],
            &rent,
        )?;

        let sender_account = SenderAccount::new(*reward_manager_info.key, eth_address, operator);
        SenderAccount::pack(sender_account, *new_sender_info.data.borrow_mut())?;

        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    fn process_submit_attestations<'a>(
        program_id: &Pubkey,
        verified_messages_info: &AccountInfo<'a>,
        reward_manager_info: &AccountInfo<'a>,
        authority_info: &AccountInfo<'a>,
        funder_info: &AccountInfo<'a>,
        rent_info: &AccountInfo<'a>,
        sender_info: &AccountInfo<'a>,
        instruction_info: &AccountInfo<'a>,
        verify_transfer_data: SubmitAttestationsArgs,
    ) -> ProgramResult {
        assert_owned_by(reward_manager_info, program_id)?;
        assert_owned_by(sender_info, program_id)?;

        let sender_account = SenderAccount::unpack(&sender_info.data.borrow())?;
        assert_account_key(reward_manager_info, &sender_account.reward_manager)?;

        // Verify derived address matches expected value
        let derived_seed = [
            VERIFY_TRANSFER_SEED_PREFIX.as_bytes().as_ref(),
            verify_transfer_data.id.as_ref(),
        ]
        .concat();

        let (reward_manager_authority, derived_address, bump_seed) =
            find_derived_pair(program_id, reward_manager_info.key, derived_seed.as_ref());

        assert_account_key(authority_info, &reward_manager_authority)?;
        assert_account_key(verified_messages_info, &derived_address)?;

        let signers_seeds = &[
            &reward_manager_authority.to_bytes()[..32],
            &derived_seed.as_slice(),
            &[bump_seed],
        ];

        if verified_messages_info.data_len() == 0 && verified_messages_info.lamports() == 0 {
            let rent = Rent::from_account_info(rent_info)?;
            create_account(
                program_id,
                funder_info.clone(),
                verified_messages_info.clone(),
                VerifiedMessages::LEN,
                &[signers_seeds],
                &rent,
            )?;
        } else {
            assert_owned_by(verified_messages_info, program_id)?;
        }

        let mut verified_messages =
            VerifiedMessages::unpack_unchecked(&verified_messages_info.data.borrow())?;
        if verified_messages.is_initialized() {
            assert_account_key(reward_manager_info, &verified_messages.reward_manager)?;
        } else {
            verified_messages = VerifiedMessages::new(*reward_manager_info.key);
        }

        // Check signatures from prev instruction
        let message = check_secp_verify_transfer(instruction_info, &sender_account.eth_address)?;

        verified_messages.add(VerifiedMessage {
            address: sender_account.eth_address,
            message,
            operator: sender_account.operator,
        });

        // Check unique senders & operators
        assert_unique_senders(&verified_messages.messages)?;

        VerifiedMessages::pack(verified_messages, *verified_messages_info.data.borrow_mut())?;

        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    fn process_transfer<'a>(
        program_id: &Pubkey,
        verified_messages_info: &AccountInfo<'a>,
        reward_manager_info: &AccountInfo<'a>,
        reward_manager_authority_info: &AccountInfo<'a>,
        reward_token_source_info: &AccountInfo<'a>,
        reward_token_recipient_info: &AccountInfo<'a>,
        transfer_account_info: &AccountInfo<'a>,
        bot_oracle_info: &AccountInfo<'a>,
        payer_info: &AccountInfo<'a>,
        rent_info: &AccountInfo<'a>,
        transfer_data: TransferArgs,
    ) -> ProgramResult {
        let rent = &Rent::from_account_info(rent_info)?;

        assert_owned_by(verified_messages_info, program_id)?;
        assert_owned_by(reward_manager_info, program_id)?;
        assert_owned_by(bot_oracle_info, program_id)?;

        let reward_manager = RewardManager::unpack(&reward_manager_info.data.borrow())?;

        let verified_messages = VerifiedMessages::unpack(&verified_messages_info.data.borrow())?;
        // Check signs for minimum required votes
        if verified_messages.messages.len() != (reward_manager.min_votes + 1) as usize {
            return Err(AudiusProgramError::NotEnoughSigners.into());
        }

        let bot_oracle = SenderAccount::unpack(&bot_oracle_info.data.borrow())?;
        assert_account_key(reward_manager_info, &bot_oracle.reward_manager)?;

        // Valid senders message
        let valid_message = [
            transfer_data.eth_recipient.as_ref(),
            b"_",
            transfer_data.amount.to_le_bytes().as_ref(),
            b"_",
            transfer_data.id.as_ref(),
            b"_",
            bot_oracle.eth_address.as_ref(),
        ]
        .concat();

        // Valid bot oracle message
        let valid_bot_oracle_message = [
            transfer_data.eth_recipient.as_ref(),
            b"_",
            transfer_data.amount.to_le_bytes().as_ref(),
            b"_",
            transfer_data.id.as_ref(),
        ]
        .concat();

        // Check messages and bot oracles
        assert_messages(
            &valid_message,
            &valid_bot_oracle_message,
            &bot_oracle.eth_address,
            &verified_messages.messages,
        )?;

        // Transfer reward tokens to user
        spl_token_transfer(
            program_id,
            &reward_manager_info.key,
            reward_token_source_info,
            reward_token_recipient_info,
            reward_manager_authority_info,
            transfer_data.amount,
        )?;

        let derived_seed = [
            TRANSFER_SEED_PREFIX.as_bytes().as_ref(),
            transfer_data.id.as_ref(),
        ]
        .concat();
        let (reward_manager_authority, _, bump_seed) =
            find_derived_pair(program_id, reward_manager_info.key, derived_seed.as_ref());

        let signers_seeds = &[
            &reward_manager_authority.to_bytes()[..32],
            &derived_seed.as_slice(),
            &[bump_seed],
        ];

        // Create deterministic account on-chain
        create_account(
            program_id,
            payer_info.clone(),
            transfer_account_info.clone(),
            0,
            &[signers_seeds],
            rent,
        )?;

        // Delete verified messages account
        let verified_messages_lamports = verified_messages_info.lamports();
        let payer_lamports = payer_info.lamports();

        **verified_messages_info.lamports.borrow_mut() = 0u64;
        **payer_info.lamports.borrow_mut() = payer_lamports
            .checked_add(verified_messages_lamports)
            .ok_or(AudiusProgramError::MathOverflow)?;

        Ok(())
    }

    /// Processes an instruction
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        input: &[u8],
    ) -> ProgramResult {
        let instruction = Instructions::try_from_slice(input)?;
        let account_info_iter = &mut accounts.iter();

        match instruction {
            Instructions::InitRewardManager(InitRewardManagerArgs { min_votes }) => {
                msg!("Instruction: InitRewardManager");

                let reward_manager = next_account_info(account_info_iter)?;
                let token_account = next_account_info(account_info_iter)?;
                let mint = next_account_info(account_info_iter)?;
                let manager = next_account_info(account_info_iter)?;
                let authority = next_account_info(account_info_iter)?;
                let _spl_token = next_account_info(account_info_iter)?;
                let rent = next_account_info(account_info_iter)?;

                Self::process_init_instruction(
                    program_id,
                    reward_manager,
                    token_account,
                    mint,
                    manager,
                    authority,
                    _spl_token,
                    rent,
                    min_votes,
                )
            }
            Instructions::ChangeRewardManagerAuthority => {
                msg!("Instruction: ChangeRewardManagerAuthority");

                let reward_manager = next_account_info(account_info_iter)?;
                let current_authority = next_account_info(account_info_iter)?;
                let new_authority = next_account_info(account_info_iter)?;

                Self::process_change_reward_manager_authority(
                    reward_manager,
                    current_authority,
                    new_authority,
                )
            }
            Instructions::CreateSender(CreateSenderArgs {
                eth_address,
                operator,
            }) => {
                msg!("Instruction: CreateSender");

                let reward_manager = next_account_info(account_info_iter)?;
                let manager_account = next_account_info(account_info_iter)?;
                let authority = next_account_info(account_info_iter)?;
                let funder_account = next_account_info(account_info_iter)?;
                let sender = next_account_info(account_info_iter)?;
                let sys_prog = next_account_info(account_info_iter)?;
                let rent = next_account_info(account_info_iter)?;

                Self::process_create_sender(
                    program_id,
                    eth_address,
                    operator,
                    reward_manager,
                    manager_account,
                    authority,
                    funder_account,
                    sender,
                    sys_prog,
                    rent,
                )
            }
            Instructions::DeleteSender => {
                msg!("Instruction: DeleteSender");

                let reward_manager = next_account_info(account_info_iter)?;
                let manager_account = next_account_info(account_info_iter)?;
                let sender = next_account_info(account_info_iter)?;
                let refunder = next_account_info(account_info_iter)?;
                let sys_prog = next_account_info(account_info_iter)?;

                Self::process_delete_sender(
                    program_id,
                    reward_manager,
                    manager_account,
                    sender,
                    refunder,
                    sys_prog,
                )
            }
            Instructions::CreateSenderPublic(AddSenderArgs {
                eth_address,
                operator,
            }) => {
                msg!("Instruction: CreateSenderPublic");

                let reward_manager = next_account_info(account_info_iter)?;
                let authority = next_account_info(account_info_iter)?;
                let funder = next_account_info(account_info_iter)?;
                let new_sender = next_account_info(account_info_iter)?;
                let instructions_info = next_account_info(account_info_iter)?;
                let rent = next_account_info(account_info_iter)?;
                let _system_program = next_account_info(account_info_iter)?;
                let signers = account_info_iter.collect::<Vec<&AccountInfo>>();

                Self::process_create_sender_public(
                    program_id,
                    reward_manager,
                    authority,
                    funder,
                    new_sender,
                    instructions_info,
                    rent,
                    signers,
                    eth_address,
                    operator,
                )
            }
            Instructions::DeleteSenderPublic => {
                msg!("Instruction: DeleteSenderPublic");
                let reward_manager = next_account_info(account_info_iter)?;
                let sender_account = next_account_info(account_info_iter)?;
                let refunder = next_account_info(account_info_iter)?;
                let instructions_info = next_account_info(account_info_iter)?;
                let signers = account_info_iter.collect::<Vec<&AccountInfo>>();

                Self::process_delete_sender_public(
                    program_id,
                    reward_manager,
                    sender_account,
                    refunder,
                    signers,
                    instructions_info,
                )
            }
            Instructions::SubmitAttestations(SubmitAttestationsArgs { id }) => {
                msg!("Instruction: SubmitAttestations");

                let verified_messages = next_account_info(account_info_iter)?;
                let reward_manager = next_account_info(account_info_iter)?;
                let authority = next_account_info(account_info_iter)?;
                let funder_info = next_account_info(account_info_iter)?;
                let sender = next_account_info(account_info_iter)?;
                let rent_info = next_account_info(account_info_iter)?;
                let instructions_info = next_account_info(account_info_iter)?;
                let _system_program_id = next_account_info(account_info_iter)?;

                Self::process_submit_attestations(
                    program_id,
                    verified_messages,
                    reward_manager,
                    authority,
                    funder_info,
                    rent_info,
                    sender,
                    instructions_info,
                    SubmitAttestationsArgs { id },
                )
            }
            Instructions::Transfer(TransferArgs {
                amount,
                id,
                eth_recipient,
            }) => {
                msg!("Instruction: Transfer");

                let verified_messages_info = next_account_info(account_info_iter)?;
                let reward_manager_info = next_account_info(account_info_iter)?;
                let reward_manager_authority_info = next_account_info(account_info_iter)?;
                let reward_token_source_info = next_account_info(account_info_iter)?;
                let reward_token_recipient_info = next_account_info(account_info_iter)?;
                let transfer_account_info = next_account_info(account_info_iter)?;
                let bot_oracle_info = next_account_info(account_info_iter)?;
                let payer_info = next_account_info(account_info_iter)?;
                let rent_info = next_account_info(account_info_iter)?;
                let _token_program_id = next_account_info(account_info_iter)?;
                let _system_program_id = next_account_info(account_info_iter)?;

                Self::process_transfer(
                    program_id,
                    verified_messages_info,
                    reward_manager_info,
                    reward_manager_authority_info,
                    reward_token_source_info,
                    reward_token_recipient_info,
                    transfer_account_info,
                    bot_oracle_info,
                    payer_info,
                    rent_info,
                    TransferArgs {
                        amount,
                        id,
                        eth_recipient,
                    },
                )
            }
        }
    }
}
