#![cfg(feature = "test-bpf")]
mod utils;

use audius_reward_manager::{instruction, state::VerifiedMessages, utils::EthereumAddress};
use libsecp256k1::{PublicKey, SecretKey};
use rand::Rng;
use rand_073;
use sha3::Digest;
use solana_program::sysvar::recent_blockhashes;
use solana_program::{
    instruction::Instruction, program_pack::Pack, pubkey::Pubkey, secp256k1_program,
    system_instruction,
};
use solana_program_test::*;
use solana_sdk::{
    secp256k1_instruction::*, signature::Keypair, signer::Signer, transaction::Transaction,
};
use std::mem::MaybeUninit;
use std::{thread, time};
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
        let derived_address = create_sender_from(
            &reward_manager,
            &manager_account,
            &mut context,
            key,
            operators[i],
        )
        .await;
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
        let derived_address = create_sender_from(
            &reward_manager,
            &manager_account,
            &mut context,
            key,
            operators[i],
        )
        .await;
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
    let oracle_sign =
        new_secp256k1_instruction_2_0(&oracle_priv_key, bot_oracle_message.as_ref(), 4);
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
        &[system_instruction::create_account(
            &context.payer.pubkey(),
            &verified_msgs_derived_acct,
            rent.minimum_balance(audius_reward_manager::state::VerifiedMessages::LEN),
            audius_reward_manager::state::VerifiedMessages::LEN as _,
            &context.payer.pubkey(),
        )],
        Some(&context.payer.pubkey()),
    );

    // Attempting to sign without programID as a signer should cause panic
    failed_tx.sign(&[&context.payer], recent_blockhash);
}
/// Fails for duplicate attestations
#[tokio::test]
async fn failure_duplicate_attestations() {
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
        let derived_address = create_sender_from(
            &reward_manager,
            &manager_account,
            &mut context,
            key,
            operators[i],
        )
        .await;
        signers[i] = derived_address;
    }

    // Send from DN1 for first txn
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

    let recent_blockhash = context.banks_client.get_recent_blockhash().await.unwrap();

    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        recent_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    // Send from DN2 for second txn
    let priv_key = SecretKey::parse(&keys[1]).unwrap();
    let sender_sign = new_secp256k1_instruction_2_0(&priv_key, senders_message.as_ref(), 0);
    let mut new_instructions = Vec::<Instruction>::new();
    new_instructions.push(sender_sign);

    new_instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &signers[1],
            &context.payer.pubkey(),
            transfer_id.to_string(),
        )
        .unwrap(),
    );

    let recent_blockhash = context.banks_client.get_recent_blockhash().await.unwrap();

    let tx = Transaction::new_signed_with_payer(
        &new_instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        recent_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    // Send from DN1 again for the 3rd txn (just reuse existing instructions)

    // Need to poll for new blockhash; otherwise if we accidentally reuse
    // the old one, the transaction won't be processed and a cached value returned
    let mut new_blockhash = context.banks_client.get_recent_blockhash().await.unwrap();
    while new_blockhash == recent_blockhash {
        thread::sleep(time::Duration::from_millis(100));
        new_blockhash = context.banks_client.get_recent_blockhash().await.unwrap();
    }

    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        new_blockhash,
    );

    let res = context.banks_client.process_transaction(tx).await;
    assert_custom_error(
        res,
        1,
        audius_reward_manager::error::AudiusProgramError::RepeatedSenders,
    )
}

#[tokio::test]
/// Tests that duplicate service operators fail
async fn failure_duplicate_operator() {
    let TestConstants {
        reward_manager,
        senders_message,
        mut context,
        transfer_id,
        mut rng,
        manager_account,
        ..
    } = setup_test_environment().await;

    // Generate data and create senders, all with the same operator
    let keys: [[u8; 32]; 3] = rng.gen();
    let operators: [EthereumAddress; 3] = rng.gen();
    let mut signers: [Pubkey; 3] = unsafe { MaybeUninit::zeroed().assume_init() };
    for (i, key) in keys.iter().enumerate() {
        let derived_address = create_sender_from(
            &reward_manager,
            &manager_account,
            &mut context,
            key,
            operators[0],
        )
        .await;
        signers[i] = derived_address;
    }

    // Send from DN1 for first txn
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

    let recent_blockhash = context.banks_client.get_recent_blockhash().await.unwrap();

    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        recent_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    // Send from DN2 for second txn, should fail
    let priv_key = SecretKey::parse(&keys[1]).unwrap();
    let sender_sign = new_secp256k1_instruction_2_0(&priv_key, senders_message.as_ref(), 0);
    let mut new_instructions = Vec::<Instruction>::new();
    new_instructions.push(sender_sign);

    new_instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &signers[1],
            &context.payer.pubkey(),
            transfer_id.to_string(),
        )
        .unwrap(),
    );

    let recent_blockhash = context.banks_client.get_recent_blockhash().await.unwrap();

    let tx = Transaction::new_signed_with_payer(
        &new_instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        recent_blockhash,
    );

    let res = context.banks_client.process_transaction(tx).await;
    assert_custom_error(
        res,
        1,
        audius_reward_manager::error::AudiusProgramError::OperatorCollision,
    )
}

// This test exercises the vulnerability in which there are two secp recovery instructions,
// the first malicious, signed from a key controlled by an attacker, and the second containing a
// valid Discovery Node eth public key, but with secp instruction indices pointing to the
// first recovery instruction.
//
// Without checking the indices, the secp recovery instructions would pass
// the precompilation step, and we would extract valid eth address from
// the second recovery instruction, assuming that was the recovered address.
#[tokio::test]
async fn validation_fails_invalid_secp_index() {
    let TestConstants {
        reward_manager,
        senders_message,
        mut context,
        transfer_id,
        mut rng,
        manager_account,
        ..
    } = setup_test_environment().await;

    let fake_sk = libsecp256k1::SecretKey::random(&mut rand_073::thread_rng());
    let real_sk = &libsecp256k1::SecretKey::random(&mut rand_073::thread_rng());
    let real_pk = libsecp256k1::PublicKey::from_secret_key(&real_sk);

    let real_eth_pubkey = construct_eth_pubkey(&real_pk);

    let eth_addr_offset = 12;
    let eth_sig_offset = 32;
    let msg_offset = 97;

    let dummy_instr_data_ind = 0;

    let secp_offsets_struct = SecpSignatureOffsets {
        eth_address_instruction_index: dummy_instr_data_ind,
        message_instruction_index: dummy_instr_data_ind,
        signature_instruction_index: dummy_instr_data_ind,
        eth_address_offset: eth_addr_offset as u16,
        message_data_offset: msg_offset as u16,
        message_data_size: senders_message.len() as u16,
        signature_offset: eth_sig_offset as u16,
    };

    let mut secp_instr_data = vec![];

    secp_instr_data.push(1u8); // count
    secp_instr_data.append(&mut bincode::serialize(&secp_offsets_struct).unwrap());
    // Here's where we put the real pubkey, which our processor tries to validate
    secp_instr_data.extend_from_slice(&real_eth_pubkey);
    // Append dummy signature data
    let mut dummy_sig = (0..65).collect();
    secp_instr_data.append(&mut dummy_sig);
    // Append the real message
    secp_instr_data.append(&mut senders_message.to_vec());

    let dummy2 = new_secp256k1_instruction_2_0(&fake_sk, &senders_message, 0);

    let secp_instruction = Instruction {
        program_id: secp256k1_program::id(),
        accounts: vec![],
        data: secp_instr_data.clone(),
    };

    // Setup transaction

    let operator: EthereumAddress = rng.gen();

    // Create a sender
    let serialized_real_sk = real_sk.serialize();
    let derived_address = create_sender_from(
        &reward_manager,
        &manager_account,
        &mut context,
        &serialized_real_sk,
        operator,
    )
    .await;

    let mut instructions = Vec::<Instruction>::new();
    instructions.push(dummy2);
    instructions.push(secp_instruction);

    instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &derived_address,
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

    // Assert that it *does* precompile - i.e. Solana runtime doesn't catch this hack
    assert!(tx.verify_precompiles(false).is_ok());

    // Assert that it *doesn't* pass our processor
    assert!(context.banks_client.process_transaction(tx).await.is_err())
}

#[tokio::test]
// This tests the vulnerability of a single secp instruction with
// manipulated offset values. This instruction has a registered eth address in the expected location,
// but has a malicious eth address + signature at other offsets - it thus
// would pass precompilation, and if we didn't check the offsets, our program would assume
// the valid eth address was the recovered address.
async fn validation_fails_incorrect_secp_offset() {
    let TestConstants {
        reward_manager,
        senders_message,
        mut context,
        transfer_id,
        mut rng,
        manager_account,
        ..
    } = setup_test_environment().await;

    let malicious_sk = libsecp256k1::SecretKey::random(&mut rand_073::thread_rng());
    let real_sk = &libsecp256k1::SecretKey::random(&mut rand_073::thread_rng());
    let malicious_pk = libsecp256k1::PublicKey::from_secret_key(&malicious_sk);
    let real_pk = libsecp256k1::PublicKey::from_secret_key(&real_sk);
    let malicious_eth_pubkey = construct_eth_pubkey(&malicious_pk);
    let real_eth_pubkey = construct_eth_pubkey(&real_pk);

    // All offsets bumped by 20 bc we load the
    // valid eth signature first
    let eth_addr_offset = 32;
    let eth_sig_offset = 52;
    let msg_offset = 117;

    let secp_offsets_struct = SecpSignatureOffsets {
        eth_address_instruction_index: 0,
        message_instruction_index: 0,
        signature_instruction_index: 0,
        eth_address_offset: eth_addr_offset as u16,
        message_data_offset: msg_offset as u16,
        message_data_size: senders_message.len() as u16,
        signature_offset: eth_sig_offset as u16,
    };

    let mut secp_instr_data = vec![];

    let mut hasher = sha3::Keccak256::new();
    hasher.update(senders_message.clone());
    let fake_message_hash = hasher.finalize();
    let mut fake_message_hash_arr = [0u8; 32];
    fake_message_hash_arr.copy_from_slice(&fake_message_hash.as_slice());
    let fake_message = libsecp256k1::Message::parse(&fake_message_hash_arr);
    let (fake_signature, fake_recovery_id) = libsecp256k1::sign(&fake_message, &malicious_sk);
    let fake_signature_arr = fake_signature.serialize();

    secp_instr_data.push(1u8); // count
    secp_instr_data.append(&mut bincode::serialize(&secp_offsets_struct).unwrap());
    // First place the real pubkey, which our processor tries to validate
    secp_instr_data.extend_from_slice(&real_eth_pubkey);
    // Next, place the malicious pubkey
    secp_instr_data.extend_from_slice(&malicious_eth_pubkey);
    // Append dummy signature data
    secp_instr_data.extend_from_slice(&fake_signature_arr);
    secp_instr_data.push(fake_recovery_id.serialize());
    // Append the real message
    secp_instr_data.append(&mut senders_message.to_vec());

    let secp_instruction = Instruction {
        program_id: secp256k1_program::id(),
        accounts: vec![],
        data: secp_instr_data.clone(),
    };

    // Setup transaction

    let operator: EthereumAddress = rng.gen();

    // Create a sender
    let serialized_real_sk = real_sk.serialize();
    let derived_address = create_sender_from(
        &reward_manager,
        &manager_account,
        &mut context,
        &serialized_real_sk,
        operator,
    )
    .await;

    let mut instructions = Vec::<Instruction>::new();

    instructions.push(secp_instruction);

    instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &derived_address,
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

    // Assert that it *does* precompile - i.e. Solana runtime doesn't catch this hack
    assert!(tx.verify_precompiles(false).is_ok());

    // Assert that it *doesn't* pass our processor
    assert!(context.banks_client.process_transaction(tx).await.is_err())
}
