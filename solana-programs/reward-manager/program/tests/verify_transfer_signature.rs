#![cfg(feature = "test-bpf")]
mod utils;

use audius_reward_manager::{
    instruction,
    state::VerifiedMessages,
    utils::{EthereumAddress},
};
use libsecp256k1::{PublicKey, SecretKey};
use rand::{Rng};
use solana_program::{instruction::Instruction, program_pack::Pack, pubkey::Pubkey, system_instruction};
use solana_program_test::*;
use solana_sdk::{
    secp256k1_instruction::*, signer::Signer, transaction::Transaction,
    signature::Keypair
};
use std::mem::MaybeUninit;
use utils::*;

#[tokio::test]
/// Test that we can successfully submit a single attestation in multiple transactions
async fn success_submit_attestations_multiple_transactions() {
    let TestConstants { 
        reward_manager,
        senders_message,
        mut context,
        transfer_id,
        mut rng,
        manager_account,
        ..
    } = setup_test_environment().await;

    // Generate data and create senders
    let keys: [[u8; 32]; 3] = rng.gen();
    let operators: [EthereumAddress; 3] = rng.gen();
    let mut signers: [Pubkey; 3] = unsafe { MaybeUninit::zeroed().assume_init() };
    for (i, key) in keys.iter().enumerate() {
        let derived_address = create_sender_from(&reward_manager, &manager_account, &mut context, key, operators[i]).await;
        signers[i] = derived_address;
    }

    let mut instructions = Vec::<Instruction>::new();
    let priv_key = SecretKey::parse(&keys[0]).unwrap();
    let sender_sign = new_secp256k1_instruction_2_0(&priv_key, senders_message.as_ref(), 0);
    instructions.push(sender_sign);

    instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &signers[0],
            &context.payer.pubkey(),
            transfer_id.to_string(),
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

    let mut instructions_2 = Vec::<Instruction>::new();
    let priv_key_2 = SecretKey::parse(&keys[1]).unwrap();
    let sender_sign_2 = new_secp256k1_instruction_2_0(&priv_key_2, senders_message.as_ref(), 0);
    instructions_2.push(sender_sign_2);

    instructions_2.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &signers[1],
            &context.payer.pubkey(),
            transfer_id.to_string(),
        )
        .unwrap(),
    );

    let tx2 = Transaction::new_signed_with_payer(
        &instructions_2,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx2).await.unwrap();
}

#[tokio::test]
/// Test that we can submit attestations in a single transaction 
async fn success_multiple_recovery_1_tx() {
    let TestConstants { 
        reward_manager,
        senders_message,
        mut context,
        transfer_id,
        mut rng,
        manager_account,
        bot_oracle_message,
        oracle_priv_key,
        eth_oracle_address,
        oracle_operator,
        oracle_derived_address,
        ..
    } = setup_test_environment().await;

    // Generate data and create senders
    let keys: [[u8; 32]; 3] = rng.gen();
    let operators: [EthereumAddress; 3] = rng.gen();
    let mut signers: [Pubkey; 3] = unsafe { MaybeUninit::zeroed().assume_init() };
    for (i, key) in keys.iter().enumerate() {
        let derived_address = create_sender_from(&reward_manager, &manager_account, &mut context, key, operators[i]).await;
        signers[i] = derived_address;
    }

    let mut instructions = Vec::<Instruction>::new();
    let priv_key = SecretKey::parse(&keys[0]).unwrap();
    let sender_sign = new_secp256k1_instruction_2_0(&priv_key, senders_message.as_ref(), 0);
    instructions.push(sender_sign);

    instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &signers[0],
            &context.payer.pubkey(),
            transfer_id.to_string(),
        )
        .unwrap(),
    );

    let priv_key_2 = SecretKey::parse(&keys[1]).unwrap();
    // Update index field
    let sender_sign_2 = new_secp256k1_instruction_2_0(&priv_key_2, senders_message.as_ref(), 2);
    instructions.push(sender_sign_2);

    instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &signers[1],
            &context.payer.pubkey(),
            transfer_id.to_string(),
        )
        .unwrap(),
    );

    // Add bot oracle signature
    let oracle_sign = new_secp256k1_instruction_2_0(&oracle_priv_key, bot_oracle_message.as_ref(), 4);
    instructions.push(oracle_sign);
    instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &oracle_derived_address,
            &context.payer.pubkey(),
            transfer_id.to_string(),
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

    // Calculate verified messages derived account
    let verified_msgs_derived_acct = get_messages_account(&reward_manager, transfer_id);

    // Confirm vote submission occurred
    let verified_msg_acct_data = get_account(&mut context, &verified_msgs_derived_acct)
        .await
        .unwrap();

    let verified_messages =
        VerifiedMessages::unpack_unchecked(&verified_msg_acct_data.data).unwrap();

    // Expect 3 msgs
    assert_eq!(verified_messages.messages.len(), 3);

    // Verify every message
    for (i, x) in verified_messages.messages.iter().enumerate() {
        println!("Item {} = {:?}", i, x);
        if i < 2 {
            let sender_priv_key = SecretKey::parse(&keys[i]).unwrap();
            let secp_pubkey = PublicKey::from_secret_key(&sender_priv_key);
            let eth_address = construct_eth_pubkey(&secp_pubkey);
            assert_eq!(x.address, eth_address);
            assert_eq!(x.operator, operators[i]);
            assert_eq!(x.message, senders_message);
        }
        if i == 3 {
            assert_eq!(x.message, bot_oracle_message);
            assert_eq!(x.address, eth_oracle_address);
            assert_eq!(x.operator, oracle_operator);
        }
    }
}

// Confirm that an external caller cannot initialize a verified messages account and 'occupy' it
#[tokio::test]
#[should_panic]
async fn failure_occupy_verified_messages_account() {
    let program_test = program_test();
    let mut context = program_test.start_with_context().await;

    let reward_manager = Keypair::new();
    let transfer_id = "4r4t23df32543f55";

    let rent = context.banks_client.get_rent().await.unwrap();
    // Calculate verified messages derived account
    let verified_msgs_derived_acct = get_messages_account(&reward_manager, transfer_id);

    // Attempt to initialize account that will be created by submit attestation maliciously
    // Use context keypair to represent a third party attempting to take ownership
    let recent_blockhash = context.banks_client.get_recent_blockhash().await.unwrap();
     let mut failed_tx = Transaction::new_with_payer(
        &[
            system_instruction::create_account(
                &context.payer.pubkey(),
                &verified_msgs_derived_acct,
                rent.minimum_balance(audius_reward_manager::state::VerifiedMessages::LEN),
                audius_reward_manager::state::VerifiedMessages::LEN as _,
                &context.payer.pubkey(),
            )
        ],
        Some(&context.payer.pubkey()),
    );

    // Attempting to sign without programID as a signer should cause panic
    failed_tx.sign(&[&context.payer], recent_blockhash);
}