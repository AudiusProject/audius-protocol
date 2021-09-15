#![cfg(feature = "test-bpf")]
mod utils;

use audius_reward_manager::{
    instruction,
    processor::VERIFY_TRANSFER_SEED_PREFIX,
    state::VerifiedMessages,
    utils::{find_derived_pair, EthereumAddress},
};
use libsecp256k1::{PublicKey, SecretKey};
use rand::{Rng};
use solana_program::{instruction::Instruction, program_pack::Pack, pubkey::Pubkey};
use solana_program_test::*;
use solana_sdk::{
    secp256k1_instruction::*, signer::Signer, transaction::Transaction,
};
use std::mem::MaybeUninit;
use utils::*;

#[tokio::test]
async fn success_verify_transfer_signature() {
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

    println!("Signing verify instruction 1");
    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    println!("Submitting verify instruction 2");
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

    println!("Signing verify instruction 2");
    let tx2 = Transaction::new_signed_with_payer(
        &instructions_2,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    println!("Submitting verify instruction 2");
    context.banks_client.process_transaction(tx2).await.unwrap();
}

#[tokio::test]
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

    // Confirm vote submission occurred
    let (_reward_manager_authority, verified_msgs_derived_acct, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [
            VERIFY_TRANSFER_SEED_PREFIX.as_bytes().as_ref(),
            transfer_id.as_ref(),
        ]
        .concat()
        .as_ref(),
    );

    let verified_msg_acct_data = get_account(&mut context, &verified_msgs_derived_acct)
        .await
        .unwrap();

    println!(
        "Expected verified_msgs_derived_acct {:}",
        verified_msgs_derived_acct
    );

    let verified_messages =
        VerifiedMessages::unpack_unchecked(&verified_msg_acct_data.data).unwrap();
    println!("verified_messages {:?}", verified_messages);
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
