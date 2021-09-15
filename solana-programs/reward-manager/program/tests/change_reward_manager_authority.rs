#![cfg(feature = "test-bpf")]

mod utils;
use audius_reward_manager::instruction;
use solana_sdk::{signature::Keypair, transaction::TransactionError, transport::TransportError};

use solana_program_test::*;
use solana_sdk::{signature::Signer, transaction::Transaction};
use utils::*;

#[tokio::test]
/// Registered manager account can change the rewards manager manager
async fn success_change_manager_() {
    let TestConstants { 
        reward_manager,
        mut context,
        token_account,
        manager_account,
        min_votes,
        ..
    } = setup_test_environment().await;


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
/// Tries to change a manager, but passing in the incorrect reward_manager
async fn failure_change_manager_bad_manager() {
    let TestConstants { 
        mut context,
        manager_account,
        ..
    } = setup_test_environment().await;

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

    let tx_result = context.banks_client.process_transaction(tx).await;
    match tx_result {
        Err(TransportError::TransactionError(TransactionError::InstructionError(0, solana_program::instruction::InstructionError::InvalidAccountData))) => assert!(true),
        _ => panic!("Returned bad error!")
    }
}

#[tokio::test]
#[should_panic(expected = "Transaction::sign failed with error KeypairPubkeyMismatch")]
/// Tries to change a manager, but passes in a current manager which isn't 
/// registered as manager
async fn failure_change_manager_authority_bad_authority() {
    let TestConstants { 
        reward_manager,
        mut context,
        manager_account,
        ..
    } = setup_test_environment().await;

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
}
