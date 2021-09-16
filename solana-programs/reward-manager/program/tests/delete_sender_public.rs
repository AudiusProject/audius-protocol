#![cfg(feature = "test-bpf")]
mod utils;
use audius_reward_manager::{
    instruction,
    processor::SENDER_SEED_PREFIX,
    state::DELETE_SENDER_MESSAGE_PREFIX,
    utils::{find_derived_pair, EthereumAddress},
};
use libsecp256k1::{SecretKey};
use rand::{Rng};
use solana_program::{instruction::InstructionError};
use solana_program::{instruction::Instruction, pubkey::Pubkey};
use solana_program_test::*;
use solana_sdk::{secp256k1_instruction::construct_eth_pubkey, signature::Keypair, signer::Signer, transaction::{Transaction, TransactionError}, transport::TransportError};
use std::mem::MaybeUninit;
use utils::*;

#[tokio::test]
/// Test able to successfully delete a sender (decentralized)
async fn success_delete_sender_public() {
    let TestConstants { 
        reward_manager,
        mut context,
        manager_account,
        mut rng,
        ..
    } = setup_test_environment().await;

    let refunder_account = Pubkey::new_unique();
    // Create 4 senders, 1 of which will be deleted
    let keys: [[u8; 32]; 4] = rng.gen();
    let operators: [EthereumAddress; 4] = rng.gen();
    let mut signers: [Pubkey; 4] = unsafe { MaybeUninit::zeroed().assume_init() };

    for (i, key) in keys.iter().enumerate() {
        let derived_address = create_sender_from(&reward_manager, &manager_account, &mut context, key, operators[i]).await;
        signers[i] = derived_address;
    }

    let mut instructions = Vec::<Instruction>::new();

    // get eth_address of sender which will be deleted
    let sender_priv_key = SecretKey::parse(&keys[3]).unwrap();
    let secp_pubkey = libsecp256k1::PublicKey::from_secret_key(&sender_priv_key);
    let eth_address = construct_eth_pubkey(&secp_pubkey);

    // Insert signs instructions
    let message = [
        DELETE_SENDER_MESSAGE_PREFIX.as_ref(),
        reward_manager.pubkey().as_ref(),
        eth_address.as_ref(),
    ]
    .concat();
    for item in keys[..3].iter().enumerate() {
        let priv_key = SecretKey::parse(item.1).unwrap();
        let inst = new_secp256k1_instruction_2_0(&priv_key, message.as_ref(), item.0 as _);
        instructions.push(inst);
    }

    instructions.push(
        instruction::delete_sender_public(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &refunder_account,
            eth_address,
            &signers[..3],
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

    let (_, sender_solana_key, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [SENDER_SEED_PREFIX.as_ref(), eth_address.as_ref()]
            .concat()
            .as_ref(),
    );

    let account = context
        .banks_client
        .get_account(sender_solana_key)
        .await
        .unwrap();
    assert!(account.is_none());
}

#[tokio::test]
async fn failure_delete_sender_insufficient_attestations() {
    let TestConstants { 
        reward_manager,
        mut context,
        manager_account,
        mut rng,
        ..
    } = setup_test_environment().await;

    let refunder_account = Pubkey::new_unique();
    // Create 4 senders, 1 of which will be deleted
    let keys: [[u8; 32]; 4] = rng.gen();
    let operators: [EthereumAddress; 4] = rng.gen();
    let mut signers: [Pubkey; 4] = unsafe { MaybeUninit::zeroed().assume_init() };

    for (i, key) in keys.iter().enumerate() {
        let derived_address = create_sender_from(&reward_manager, &manager_account, &mut context, key, operators[i]).await;
        signers[i] = derived_address;
    }

    let mut instructions = Vec::<Instruction>::new();

    // get eth_address of sender which will be deleted
    let sender_priv_key = SecretKey::parse(&keys[3]).unwrap();
    let secp_pubkey = libsecp256k1::PublicKey::from_secret_key(&sender_priv_key);
    let eth_address = construct_eth_pubkey(&secp_pubkey);

    // Insert signs instructions
    let message = [
        DELETE_SENDER_MESSAGE_PREFIX.as_ref(),
        reward_manager.pubkey().as_ref(),
        eth_address.as_ref(),
    ]
    .concat();
    for item in keys[..2].iter().enumerate() {
        let priv_key = SecretKey::parse(item.1).unwrap();
        let inst = new_secp256k1_instruction_2_0(&priv_key, message.as_ref(), item.0 as _);
        instructions.push(inst);
    }

    // Push one less than min_votes to the signers array
    instructions.push(
        instruction::delete_sender_public(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &refunder_account,
            eth_address,
            &signers[..2],
        )
        .unwrap(),
    );

    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );
    let res = context.banks_client.process_transaction(tx).await;
    assert_custom_error(res, 2, audius_reward_manager::error::AudiusProgramError::NotEnoughSigners);
}

#[tokio::test]
/// Test deleting sender fails if signers don't match known senders
async fn failure_delete_sender_public_mismatched_signature_to_pubkey() {
    let TestConstants { 
        reward_manager,
        mut context,
        manager_account,
        mut rng,
        ..
    } = setup_test_environment().await;

    let refunder_account = Pubkey::new_unique();
    let keys: [[u8; 32]; 4] = rng.gen();
    let operators: [EthereumAddress; 4] = rng.gen();
    let mut signers: [Pubkey; 4] = unsafe { MaybeUninit::zeroed().assume_init() };

    for (i, key) in keys.iter().enumerate() {
        let derived_address = create_sender_from(&reward_manager, &manager_account, &mut context, key, operators[i]).await;
        signers[i] = derived_address;
    }

    let mut instructions = Vec::<Instruction>::new();

    // get eth_address of sender which will be deleted
    let sender_priv_key = SecretKey::parse(&keys[3]).unwrap();
    let secp_pubkey = libsecp256k1::PublicKey::from_secret_key(&sender_priv_key);
    let eth_address = construct_eth_pubkey(&secp_pubkey);

    // Insert signs instructions
    let message = [
        DELETE_SENDER_MESSAGE_PREFIX.as_ref(),
        reward_manager.pubkey().as_ref(),
        eth_address.as_ref(),
    ]
    .concat();
    for item in keys[..3].iter().enumerate() {
        let priv_key = SecretKey::parse(item.1).unwrap();
        let inst = new_secp256k1_instruction_2_0(&priv_key, message.as_ref(), item.0 as _);
        instructions.push(inst);
    }

    // random index to denote which signer to replace with new pubkey
    let random_index = rand::thread_rng().gen_range(0..3);
    let mut new_signers: [Pubkey; 3] = [Keypair::new().pubkey(); 3];
    new_signers[..3].clone_from_slice(&signers[..3]);
    new_signers[random_index] = Keypair::new().pubkey();
    instructions.push(
        instruction::delete_sender_public(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &refunder_account,
            eth_address,
            // use new signers
            &new_signers
        )
        .unwrap(),
    );

    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );
    let tx_result = context.banks_client.process_transaction(tx).await;

    match tx_result {
        Err(TransportError::TransactionError(TransactionError::InstructionError(3, InstructionError::BorshIoError(_)))) => assert!(true),
        _ => panic!("Returned incorrect error!"),
    }
}

#[tokio::test]
async fn failure_duplicate_operators_delete_sender() {
    let TestConstants { 
        reward_manager,
        mut context,
        manager_account,
        mut rng,
        ..
    } = setup_test_environment().await;

    let refunder_account = Pubkey::new_unique();
    // Create 4 senders, 1 of which will be deleted
    let keys: [[u8; 32]; 4] = rng.gen();
    // Reuse the same operator 3x
    let operator: EthereumAddress = rng.gen();
    let mut signers: [Pubkey; 4] = unsafe { MaybeUninit::zeroed().assume_init() };

    for (i, key) in keys.iter().enumerate() {
        let derived_address = create_sender_from(&reward_manager, &manager_account, &mut context, key, operator).await;
        signers[i] = derived_address;
    }

    let mut instructions = Vec::<Instruction>::new();

    // get eth_address of sender which will be deleted
    let sender_priv_key = SecretKey::parse(&keys[3]).unwrap();
    let secp_pubkey = libsecp256k1::PublicKey::from_secret_key(&sender_priv_key);
    let eth_address = construct_eth_pubkey(&secp_pubkey);

    // Insert signs instructions
    let message = [
        DELETE_SENDER_MESSAGE_PREFIX.as_ref(),
        reward_manager.pubkey().as_ref(),
        eth_address.as_ref(),
    ]
    .concat();
    for item in keys[..3].iter().enumerate() {
        let priv_key = SecretKey::parse(item.1).unwrap();
        let inst = new_secp256k1_instruction_2_0(&priv_key, message.as_ref(), item.0 as _);
        instructions.push(inst);
    }

    // Push one less than min_votes to the signers array
    instructions.push(
        instruction::delete_sender_public(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &refunder_account,
            eth_address,
            &signers[..3],
        )
        .unwrap(),
    );

    println!("instructions.length = {:?}", instructions.len());
    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );
    let res = context.banks_client.process_transaction(tx).await;
    assert!(res.is_err());
    assert_custom_error(res, 3, audius_reward_manager::error::AudiusProgramError::OperatorCollision);
}