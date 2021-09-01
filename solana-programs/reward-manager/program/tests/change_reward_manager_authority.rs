#![cfg(feature = "test-bpf")]

mod utils;
use audius_reward_manager::instruction;
use solana_sdk::signature::Keypair;
use utils::program_test;

use solana_program::program_pack::Pack;
use solana_program_test::*;
use solana_sdk::{signature::Signer, transaction::Transaction};
use utils::*;

#[tokio::test]
async fn success_change_manager_authority() {
    let program_test = program_test();

    let mint = Keypair::new();
    let mint_authority = Keypair::new();
    let token_account = Keypair::new();

    let reward_manager = Keypair::new();
    let manager_account = Keypair::new();
    let min_votes = 3;

    let mut context = program_test.start_with_context().await;
    let rent = context.banks_client.get_rent().await.unwrap();

    create_mint(
        &mut context,
        &mint,
        rent.minimum_balance(spl_token::state::Mint::LEN),
        &mint_authority.pubkey(),
    )
    .await
    .unwrap();

    init_reward_manager(
        &mut context,
        &reward_manager,
        &token_account,
        &mint.pubkey(),
        &manager_account.pubkey(),
        min_votes,
    )
    .await;

    let new_manager = Keypair::new();

    let tx = Transaction::new_signed_with_payer(
        &[instruction::change_manager_authority(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &manager_account.pubkey(),
            &new_manager.pubkey(),
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer, &manager_account],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    assert_eq!(
        audius_reward_manager::state::RewardManager::new(
            token_account.pubkey(),
            new_manager.pubkey(),
            min_votes
        ),
        context
            .banks_client
            .get_account_data_with_borsh(reward_manager.pubkey())
            .await
            .unwrap()
    );
}

#[tokio::test]
#[should_panic]
async fn failure_bad_manager() {
    let program_test = program_test();

    let mint = Keypair::new();
    let mint_authority = Keypair::new();
    let token_account = Keypair::new();

    let reward_manager = Keypair::new();
    let manager_account = Keypair::new();
    let min_votes = 3;

    let mut context = program_test.start_with_context().await;
    let rent = context.banks_client.get_rent().await.unwrap();

    create_mint(
        &mut context,
        &mint,
        rent.minimum_balance(spl_token::state::Mint::LEN),
        &mint_authority.pubkey(),
    )
    .await
    .unwrap();

    init_reward_manager(
        &mut context,
        &reward_manager,
        &token_account,
        &mint.pubkey(),
        &manager_account.pubkey(),
        min_votes,
    )
    .await;

    let new_manager = Keypair::new();

    let bad_reward_manager = Keypair::new();

    let tx = Transaction::new_signed_with_payer(
        &[instruction::change_manager_authority(
            &audius_reward_manager::id(),
            &bad_reward_manager.pubkey(),
            &manager_account.pubkey(),
            &new_manager.pubkey(),
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer, &manager_account],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    assert_eq!(
        audius_reward_manager::state::RewardManager::new(
            token_account.pubkey(),
            new_manager.pubkey(),
            min_votes
        ),
        context
            .banks_client
            .get_account_data_with_borsh(reward_manager.pubkey())
            .await
            .unwrap()
    );
}

#[tokio::test]
#[should_panic(expected = "KeypairPubkeyMismatch")]
async fn failure_bad_authority() {
    let program_test = program_test();

    let mint = Keypair::new();
    let mint_authority = Keypair::new();
    let token_account = Keypair::new();

    let reward_manager = Keypair::new();
    let manager_account = Keypair::new();
    let min_votes = 3;

    let mut context = program_test.start_with_context().await;
    let rent = context.banks_client.get_rent().await.unwrap();

    create_mint(
        &mut context,
        &mint,
        rent.minimum_balance(spl_token::state::Mint::LEN),
        &mint_authority.pubkey(),
    )
    .await
    .unwrap();

    init_reward_manager(
        &mut context,
        &reward_manager,
        &token_account,
        &mint.pubkey(),
        &manager_account.pubkey(),
        min_votes,
    )
    .await;

    let new_manager = Keypair::new();

    let bad_authority = Keypair::new();

    let tx = Transaction::new_signed_with_payer(
        &[instruction::change_manager_authority(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &bad_authority.pubkey(),
            &new_manager.pubkey(),
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer, &manager_account],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    assert_eq!(
        audius_reward_manager::state::RewardManager::new(
            token_account.pubkey(),
            new_manager.pubkey(),
            min_votes
        ),
        context
            .banks_client
            .get_account_data_with_borsh(reward_manager.pubkey())
            .await
            .unwrap()
    );
}
