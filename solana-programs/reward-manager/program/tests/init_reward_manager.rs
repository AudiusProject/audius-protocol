#![cfg(feature = "test-bpf")]

mod utils;
use audius_reward_manager::instruction;
use borsh::BorshSerialize;
use solana_program::program_option::COption;
use solana_program::program_pack::IsInitialized;
use solana_sdk::signature::Keypair;
use utils::program_test;

use solana_program::instruction::InstructionError;
use solana_program::{program_pack::Pack, pubkey::Pubkey};
use solana_program_test::*;
use solana_sdk::{
    account::Account,
    signature::Signer,
    system_instruction::create_account,
    transaction::{Transaction, TransactionError},
};

/// The test is especially work like if it used by a user
#[tokio::test]
async fn success() {
    let mut program_test = program_test();

    let manager = Pubkey::new_unique();
    let reward_manager = Keypair::new();
    let token_account = Keypair::new();
    let mint = Pubkey::new_unique();
    let min_votes = 3;

    let mut data = vec![0u8; spl_token::state::Mint::LEN];
    let mint_data = spl_token::state::Mint {
        mint_authority: COption::None,
        supply: 100,
        decimals: 4,
        is_initialized: true,
        freeze_authority: COption::None,
    };
    mint_data.pack_into_slice(data.as_mut_slice());
    program_test.add_account(
        mint,
        Account {
            lamports: 9000,
            data,
            owner: audius_reward_manager::id(),
            executable: false,
            rent_epoch: 0,
        },
    );

    let mut context = program_test.start_with_context().await;
    let rent = context.banks_client.get_rent().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[
            create_account(
                &context.payer.pubkey(),
                &reward_manager.pubkey(),
                rent.minimum_balance(audius_reward_manager::state::RewardManager::LEN),
                audius_reward_manager::state::RewardManager::LEN as _,
                &audius_reward_manager::id(),
            ),
            create_account(
                &context.payer.pubkey(),
                &token_account.pubkey(),
                rent.minimum_balance(spl_token::state::Account::LEN),
                spl_token::state::Account::LEN as _,
                &spl_token::id(),
            ),
            instruction::init(
                &audius_reward_manager::id(),
                &reward_manager.pubkey(),
                &token_account.pubkey(),
                &mint,
                &manager,
                min_votes,
            )
            .unwrap(),
        ],
        Some(&context.payer.pubkey()),
        &[&context.payer, &reward_manager, &token_account],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    assert_eq!(
        audius_reward_manager::state::RewardManager::new(
            token_account.pubkey(),
            manager,
            min_votes
        ),
        context
            .banks_client
            .get_account_data_with_borsh(reward_manager.pubkey())
            .await
            .unwrap()
    );

    let token_data: spl_token::state::Account = context
        .banks_client
        .get_packed_account_data(token_account.pubkey())
        .await
        .unwrap();

    assert!(token_data.is_initialized());
}

#[tokio::test]
async fn fail_already_initialized() {
    let mut program_test = program_test();

    let reward_manager = Pubkey::new_unique();
    let token_account = Pubkey::new_unique();
    let mint = Pubkey::new_unique();
    let manager = Pubkey::new_unique();

    let mut data = Vec::<u8>::with_capacity(audius_reward_manager::state::RewardManager::LEN);
    audius_reward_manager::state::RewardManager::new(token_account, manager, 3)
        .serialize(&mut data)
        .unwrap();
    program_test.add_account(
        reward_manager,
        Account {
            lamports: 9000,
            data,
            owner: audius_reward_manager::id(),
            executable: false,
            rent_epoch: 0,
        },
    );

    let mut context = program_test.start_with_context().await;
    let tx = Transaction::new_signed_with_payer(
        &[instruction::init(
            &audius_reward_manager::id(),
            &reward_manager,
            &token_account,
            &mint,
            &manager,
            3,
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    assert_eq!(
        context
            .banks_client
            .process_transaction(tx)
            .await
            .unwrap_err()
            .unwrap(),
        TransactionError::InstructionError(0, InstructionError::AccountAlreadyInitialized)
    );
}
