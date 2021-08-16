#![cfg(feature = "test-bpf")]
mod utils;
use audius_reward_manager::{
    instruction,
    processor::SENDER_SEED_PREFIX,
    state::{SenderAccount, ADD_SENDER_MESSAGE_PREFIX},
    utils::{find_derived_pair, EthereumAddress},
};
use libsecp256k1::{PublicKey, SecretKey};
use rand::{thread_rng, Rng};
use solana_program::program_pack::Pack;
use solana_program::{instruction::Instruction, pubkey::Pubkey};
use solana_program_test::*;
use solana_sdk::{
    secp256k1_instruction::construct_eth_pubkey, signature::Keypair, signer::Signer,
    transaction::Transaction,
};
use std::mem::MaybeUninit;
use utils::*;

#[tokio::test]
async fn success() {
    let program_test = program_test();
    let mut rng = thread_rng();

    let mint = Keypair::new();
    let mint_authority = Keypair::new();
    let token_account = Keypair::new();

    let reward_manager = Keypair::new();
    let manager_account = Keypair::new();
    let eth_address: EthereumAddress = rng.gen();
    let operator: EthereumAddress = rng.gen();
    let keys: [[u8; 32]; 3] = rng.gen();
    let mut signers: [Pubkey; 3] = unsafe { MaybeUninit::zeroed().assume_init() };

    for item in keys.iter().enumerate() {
        let sender_priv_key = SecretKey::parse(item.1).unwrap();
        let secp_pubkey = PublicKey::from_secret_key(&sender_priv_key);
        let eth_address = construct_eth_pubkey(&secp_pubkey);

        let (_, derived_address, _) = find_derived_pair(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            [SENDER_SEED_PREFIX.as_ref(), eth_address.as_ref()]
                .concat()
                .as_ref(),
        );

        signers[item.0] = derived_address;
    }

    let (_, derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [SENDER_SEED_PREFIX.as_ref(), eth_address.as_ref()]
            .concat()
            .as_ref(),
    );

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
        3,
    )
    .await;

    // Create senders
    for key in &keys {
        let sender_priv_key = SecretKey::parse(&key).unwrap();
        let secp_pubkey = libsecp256k1::PublicKey::from_secret_key(&sender_priv_key);
        let eth_address = construct_eth_pubkey(&secp_pubkey);
        let operator: EthereumAddress = rng.gen();
        create_sender(
            &mut context,
            &reward_manager.pubkey(),
            &manager_account,
            eth_address,
            operator,
        )
        .await;
    }

    let mut instructions = Vec::<Instruction>::new();

    // Insert signs instructions
    let message = [
        ADD_SENDER_MESSAGE_PREFIX.as_ref(),
        reward_manager.pubkey().as_ref(),
        eth_address.as_ref(),
    ]
    .concat();
    for item in keys.iter().enumerate() {
        let priv_key = SecretKey::parse(item.1).unwrap();
        let inst = new_secp256k1_instruction_2_0(&priv_key, message.as_ref(), item.0 as _);
        instructions.push(inst);
    }

    instructions.push(
        instruction::create_sender_public(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &context.payer.pubkey(),
            eth_address,
            operator,
            &signers,
        )
        .unwrap(),
    );

    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );
    context.banks_client.process_transaction(tx).await.unwrap();

    assert_eq!(
        SenderAccount::new(reward_manager.pubkey(), eth_address, operator),
        context
            .banks_client
            .get_account_data_with_borsh(derived_address)
            .await
            .unwrap()
    );
}
