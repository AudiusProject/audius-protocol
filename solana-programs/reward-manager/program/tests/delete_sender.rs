#![cfg(feature = "test-bpf")]
mod utils;
use audius_reward_manager::{
    instruction,
    processor::SENDER_SEED_PREFIX,
    state::{RewardManager, SenderAccount},
    utils::{find_derived_pair, EthereumAddress},
};
use borsh::BorshSerialize;
use rand::{thread_rng, Rng};
use solana_program::pubkey::Pubkey;
use solana_program_test::*;
use solana_sdk::{account::Account, signature::Keypair, signer::Signer, transaction::Transaction};
use utils::program_test;

#[tokio::test]
/// Test able to successfully delete a sender
async fn success_delete_sender() {
    let mut program_test = program_test();
    let mut rng = thread_rng();

    let token_account = Pubkey::new_unique();
    let reward_manager = Pubkey::new_unique();
    let manager_account = Keypair::new();
    let refunder_account = Pubkey::new_unique();
    let eth_address: EthereumAddress = rng.gen();
    let operator: EthereumAddress = rng.gen();

    let (_, derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager,
        [SENDER_SEED_PREFIX.as_ref(), eth_address.as_ref()]
            .concat()
            .as_ref(),
    );

    let reward_manager_data = RewardManager::new(token_account, manager_account.pubkey(), 3);
    program_test.add_account(
        reward_manager,
        Account {
            lamports: 9000,
            data: reward_manager_data.try_to_vec().unwrap(),
            owner: audius_reward_manager::id(),
            executable: false,
            rent_epoch: 0,
        },
    );

    let sender_data = SenderAccount::new(reward_manager, eth_address, operator);
    program_test.add_account(
        derived_address,
        Account {
            lamports: 9000,
            data: sender_data.try_to_vec().unwrap(),
            owner: audius_reward_manager::id(),
            executable: false,
            rent_epoch: 0,
        },
    );

    let mut context = program_test.start_with_context().await;
    let tx = Transaction::new_signed_with_payer(
        &[instruction::delete_sender(
            &audius_reward_manager::id(),
            &reward_manager,
            &manager_account.pubkey(),
            &refunder_account,
            eth_address,
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer, &manager_account],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    let account = context
        .banks_client
        .get_account(derived_address)
        .await
        .unwrap();
    assert!(account.is_none());
}
