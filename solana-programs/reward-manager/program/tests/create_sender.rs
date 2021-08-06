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
async fn success() {
    let mut program_test = program_test();
    let mut rng = thread_rng();

    let reward_manager = Pubkey::new_unique();
    let token_account = Pubkey::new_unique();
    let manager_account = Keypair::new();
    let eth_address: EthereumAddress = rng.gen();
    let operator: EthereumAddress = rng.gen();

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

    let mut context = program_test.start_with_context().await;
    let tx = Transaction::new_signed_with_payer(
        &[instruction::create_sender(
            &audius_reward_manager::id(),
            &reward_manager,
            &manager_account.pubkey(),
            &context.payer.pubkey(),
            eth_address,
            operator,
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer, &manager_account],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    let (_, derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager,
        [SENDER_SEED_PREFIX.as_ref(), eth_address.as_ref()]
            .concat()
            .as_ref(),
    );

    assert_eq!(
        SenderAccount::new(reward_manager, eth_address, operator),
        context
            .banks_client
            .get_account_data_with_borsh(derived_address)
            .await
            .unwrap()
    );
}
