#![cfg(feature = "test-bpf")]
mod utils;

use audius_reward_manager::{error::AudiusProgramError, instruction, processor::{SENDER_SEED_PREFIX, TRANSFER_ACC_SPACE, TRANSFER_SEED_PREFIX, VERIFY_TRANSFER_SEED_PREFIX}, state::{VerifiedMessages}, utils::{find_derived_pair, EthereumAddress}, vote_message};
use libsecp256k1::{PublicKey, SecretKey};
use rand::{thread_rng, Rng};
use solana_program::{instruction::{Instruction}, program_pack::Pack, pubkey::Pubkey};
use solana_program_test::*;
use solana_sdk::{secp256k1_instruction::*, signature::Keypair, signer::Signer, transaction::{Transaction}};
use std::{mem::MaybeUninit};
use utils::*;

#[tokio::test]
async fn success_transfer() {
    /* Create verified messages and initialize reward manager */
    let mut program_test = program_test();

    program_test.add_program("claimable_tokens", claimable_tokens::id(), None);
    let mut rng = thread_rng();

    let mut context = program_test.start_with_context().await;

    let mint = Keypair::new();
    let mint_authority = Keypair::new();

    let token_account = Keypair::new();
    let reward_manager = Keypair::new();
    let manager_account = Keypair::new();

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

    // Generate data and create oracle
    let key: [u8; 32] = rng.gen();
    let oracle_priv_key = SecretKey::parse(&key).unwrap();
    let secp_oracle_pubkey = PublicKey::from_secret_key(&oracle_priv_key);
    let eth_oracle_address = construct_eth_pubkey(&secp_oracle_pubkey);
    let oracle_operator: EthereumAddress = rng.gen();

    let oracle_derived_address = get_oracle_address(&reward_manager, eth_oracle_address);
    
    create_sender(
        &mut context,
        &reward_manager.pubkey(),
        &manager_account,
        eth_oracle_address,
        oracle_operator,
    )
    .await;

    let tokens_amount = 10_000u64;
    let recipient_eth_key = [7u8; 20];
    let transfer_id = "4r4t23df32543f55";

    mint_tokens_to(
        &mut context,
        &mint.pubkey(),
        &token_account.pubkey(),
        &mint_authority,
        tokens_amount,
    )
    .await
    .unwrap();

    let bot_oracle_message = vote_message!([
        recipient_eth_key.as_ref(),
        b"_",
        tokens_amount.to_le_bytes().as_ref(),
        b"_",
        transfer_id.as_ref(),
    ]
    .concat());

    let senders_message = vote_message!([
        recipient_eth_key.as_ref(),
        b"_",
        tokens_amount.to_le_bytes().as_ref(),
        b"_",
        transfer_id.as_ref(),
        b"_",
        eth_oracle_address.as_ref(),
    ]
    .concat());

    // Generate data and create senders
    let keys: [[u8; 32]; 3] = rng.gen();
    let operators: [EthereumAddress; 3] = rng.gen();
    let mut signers: [Pubkey; 3] = unsafe { MaybeUninit::zeroed().assume_init() };
    for (i, key) in keys.iter().enumerate() {
        let derived_address = create_sender_from(&reward_manager, &manager_account, &mut context,key, operators[i]).await;
        signers[i] = derived_address;
    }

    let mut instructions = Vec::<Instruction>::new();
    // Add 3 messages and bot oracle
    let oracle_sign =
        new_secp256k1_instruction_2_0(&oracle_priv_key, bot_oracle_message.as_ref(), 0);
    instructions.push(oracle_sign);

    for item in keys.iter().enumerate() {
        let priv_key = SecretKey::parse(item.1).unwrap();
        let inst = new_secp256k1_instruction_2_0(
            &priv_key,
            senders_message.as_ref(),
            (2 * item.0 + 1) as u8,
        );
        instructions.push(inst);
        instructions.push(
            instruction::submit_attestations(
                &audius_reward_manager::id(),
                &reward_manager.pubkey(),
                &signers[item.0],
                &context.payer.pubkey(),
                transfer_id.to_string()
            )
            .unwrap(),
        );
    }

    let oracle_sign = new_secp256k1_instruction_2_0(
        &oracle_priv_key,
        bot_oracle_message.as_ref(),
        (keys.len() * 2 + 1) as u8,
    );
    instructions.push(oracle_sign);
    instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &oracle_derived_address,
            &context.payer.pubkey(),
            transfer_id.to_string()
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


    let transfer_account = get_transfer_account(&reward_manager, transfer_id);
    let verified_messages_account = get_messages_account(&reward_manager, transfer_id);

    let recipient_sol_key = claimable_tokens::utils::program::get_address_pair(
        &claimable_tokens::id(),
        &mint.pubkey(),
        recipient_eth_key,
    )
    .unwrap();
    println!("Creating...Recipient sol key = {:?}", &recipient_sol_key.derive.address);
    create_recipient_with_claimable_program(&mut context, &mint.pubkey(), recipient_eth_key).await;
    println!("Created recipient sol key = {:?}", &recipient_sol_key.derive.address);

    let tx = Transaction::new_signed_with_payer(
        &[instruction::evaluate_attestations(
            &audius_reward_manager::id(),
            &verified_messages_account,
            &reward_manager.pubkey(),
            &token_account.pubkey(),
            &recipient_sol_key.derive.address,
            &oracle_derived_address,
            &context.payer.pubkey(),
            10_000u64,
            transfer_id.to_string(),
            recipient_eth_key,
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    let transfer_account_data = get_account(&mut context, &transfer_account)
        .await
        .unwrap();

    assert_eq!(
        transfer_account_data.lamports,
        rent.minimum_balance(TRANSFER_ACC_SPACE)
    );
    assert_eq!(transfer_account_data.data.len(), TRANSFER_ACC_SPACE);
    let recipient_account_data = get_account(& mut context, &recipient_sol_key.derive.address).await.unwrap();
    let recipient_account = spl_token::state::Account::unpack(&recipient_account_data.data.as_slice()).unwrap();
    assert_eq!(recipient_account.amount, 10_000u64)
}

#[tokio::test]
/// Creates an invalid messages account by filling it wihout an oracle attestation,
/// validates that we see the expected error on calling `evaluate`, and then that we can
/// wipe the account by calling `submit` again with correct attestations and
/// finally succeed in `evaluate`.
async fn invalid_messages_are_wiped() {

    /* Create verified messages and initialize reward manager */
    let mut program_test = program_test();

    program_test.add_program("claimable_tokens", claimable_tokens::id(), None);
    let mut rng = thread_rng();

    let mut context = program_test.start_with_context().await;

    let mint = Keypair::new();
    let mint_authority = Keypair::new();

    let token_account = Keypair::new();
    let reward_manager = Keypair::new();
    let manager_account = Keypair::new();

    let rent = context.banks_client.get_rent().await.unwrap();

    create_mint(
        &mut context,
        &mint,
        rent.minimum_balance(spl_token::state::Mint::LEN),
        &mint_authority.pubkey(),
    )
    .await
    .unwrap();

    let recipient_eth_key = [7u8; 20];
    let transfer_id = "4r4t23df32543f56";
    let tokens_amount = 10_000u64;


    init_reward_manager(
        &mut context,
        &reward_manager,
        &token_account,
        &mint.pubkey(),
        &manager_account.pubkey(),
        3,
    )
    .await;

    let key: [u8; 32] = rng.gen();
    let oracle_priv_key = SecretKey::parse(&key).unwrap();
    let secp_oracle_pubkey = PublicKey::from_secret_key(&oracle_priv_key);
    let eth_oracle_address = construct_eth_pubkey(&secp_oracle_pubkey);

    let oracle_operator: EthereumAddress = rng.gen();
    let oracle_derived_address = get_oracle_address(&reward_manager, eth_oracle_address);

    create_sender(
        &mut context,
        &reward_manager.pubkey(),
        &manager_account,
        eth_oracle_address,
        oracle_operator,
    )
    .await;

    mint_tokens_to(
        &mut context,
        &mint.pubkey(),
        &token_account.pubkey(),
        &mint_authority,
        tokens_amount,
    )
    .await
    .unwrap();

    // Generate data and create senders
    let keys: [[u8; 32]; 4] = rng.gen();
    let operators: [EthereumAddress; 4] = rng.gen();

    let mut signers: [Pubkey; 4] = unsafe { MaybeUninit::zeroed().assume_init() };
    for (i, key)in keys.iter().enumerate() {
        let derived_address = create_sender_from(&reward_manager, &manager_account, &mut context,key, operators[i]).await;
        signers[i] = derived_address;
    }

    
    let senders_message = vote_message!([
        recipient_eth_key.as_ref(),
        b"_",
        tokens_amount.to_le_bytes().as_ref(),
        b"_",
        transfer_id.as_ref(),
        b"_",
        eth_oracle_address.as_ref(),
    ]
    .concat());

    let bot_oracle_message = vote_message!([
        recipient_eth_key.as_ref(),
        b"_",
        tokens_amount.to_le_bytes().as_ref(),
        b"_",
        transfer_id.as_ref(),
    ]
    .concat());
        
    let mut instructions = Vec::<Instruction>::new();

    for item in keys.iter().enumerate() {
        let priv_key = SecretKey::parse(item.1).unwrap();
        let inst = new_secp256k1_instruction_2_0(
            &priv_key,
            senders_message.as_ref(),
            (2 * item.0) as u8,
        );
        instructions.push(inst);
        instructions.push(
            instruction::submit_attestations(
                &audius_reward_manager::id(),
                &reward_manager.pubkey(),
                &signers[item.0],
                &context.payer.pubkey(),
                transfer_id.to_string()
            )
            .unwrap(),
        );
    }

    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    let transfer_account = get_transfer_account(&reward_manager, transfer_id);

    // Assert that verified messages account initially has sufficient lamports
    let verified_messages_account = get_messages_account(&reward_manager, transfer_id);
    let verified_messages_account_data = get_account(&mut context, &verified_messages_account).await.unwrap();
    assert_eq!(verified_messages_account_data.lamports, rent.minimum_balance(VerifiedMessages::LEN));

    let recipient_sol_key = claimable_tokens::utils::program::get_address_pair(
        &claimable_tokens::id(),
        &mint.pubkey(),
        recipient_eth_key,
    )
    .unwrap();
    create_recipient_with_claimable_program(&mut context, &mint.pubkey(), recipient_eth_key).await;

    let tx = Transaction::new_signed_with_payer(
        &[instruction::evaluate_attestations(
            &audius_reward_manager::id(),
            &verified_messages_account,
            &reward_manager.pubkey(),
            &token_account.pubkey(),
            &recipient_sol_key.derive.address,
            &oracle_derived_address,
            &context.payer.pubkey(),
            10_000u64,
            transfer_id.to_string(),
            recipient_eth_key,
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    let res = context.banks_client.process_transaction(tx).await;
    // Ensure we got the expected NotEnoughSigners error
    assert_custom_error(res, 0, AudiusProgramError::NotEnoughSigners);

    // Ensure that the transfer account wasn't created
    let transfer_account_data = get_account(&mut context, &transfer_account)
        .await;
    assert!(transfer_account_data.is_none());

    // Try again to submit, this time with correct instructions
    let mut instructions = Vec::<Instruction>::new();

    // Only use operators 1-3
    for item in keys[..3].iter().enumerate() {
        let priv_key = SecretKey::parse(item.1).unwrap();
        let inst = new_secp256k1_instruction_2_0(
            &priv_key,
            senders_message.as_ref(),
            (2 * item.0) as u8,
        );
        instructions.push(inst);
        instructions.push(
            instruction::submit_attestations(
                &audius_reward_manager::id(),
                &reward_manager.pubkey(),
                &signers[item.0],
                &context.payer.pubkey(),
                transfer_id.to_string()
            )
            .unwrap(),
        );
    }
    // Now add the oracle
    let oracle_sign = new_secp256k1_instruction_2_0(
        &oracle_priv_key,
        bot_oracle_message.as_ref(),
        (instructions.len()) as u8,
    );
    instructions.push(oracle_sign);
    instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &oracle_derived_address,
            &context.payer.pubkey(),
            transfer_id.to_string()
        )
        .unwrap(),
    );
    println!("{:?}", instructions.len());

    // Send the submit instruction
    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

    // Send the evaluate instruction
    let recent_blockhash = context.banks_client.get_recent_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[instruction::evaluate_attestations(
            &audius_reward_manager::id(),
            &verified_messages_account,
            &reward_manager.pubkey(),
            &token_account.pubkey(),
            &recipient_sol_key.derive.address,
            &oracle_derived_address,
            &context.payer.pubkey(),
            10_000u64,
            transfer_id.to_string(),
            recipient_eth_key,
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        recent_blockhash
    );

    context.banks_client.process_transaction(tx).await.unwrap();
}


#[tokio::test]
async fn failure_transfer_invalid_message_format() {
    /* Create verified messages and initialize reward manager */
    let mut program_test = program_test();

    program_test.add_program("claimable_tokens", claimable_tokens::id(), None);
    let mut rng = thread_rng();

    let mut context = program_test.start_with_context().await;

    let mint = Keypair::new();
    let mint_authority = Keypair::new();

    let token_account = Keypair::new();
    let reward_manager = Keypair::new();
    let manager_account = Keypair::new();

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

    // Generate data and create oracle
    let key: [u8; 32] = rng.gen();
    let oracle_priv_key = SecretKey::parse(&key).unwrap();
    let secp_oracle_pubkey = PublicKey::from_secret_key(&oracle_priv_key);
    let eth_oracle_address = construct_eth_pubkey(&secp_oracle_pubkey);
    let oracle_operator: EthereumAddress = rng.gen();

    let (_, oracle_derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [SENDER_SEED_PREFIX.as_ref(), eth_oracle_address.as_ref()]
            .concat()
            .as_ref(),
    );

    create_sender(
        &mut context,
        &reward_manager.pubkey(),
        &manager_account,
        eth_oracle_address,
        oracle_operator,
    )
    .await;

    let tokens_amount = 10_000u64;
    let recipient_eth_key = [7u8; 20];
    let transfer_id = "4r4t23df32543f55";

    mint_tokens_to(
        &mut context,
        &mint.pubkey(),
        &token_account.pubkey(),
        &mint_authority,
        tokens_amount,
    )
    .await
    .unwrap();

    let bot_oracle_message = vote_message!([
        recipient_eth_key.as_ref(),
        b"_",
        tokens_amount.to_le_bytes().as_ref(),
        b"_",
        transfer_id.as_ref(),
    ]
    .concat());

    // Use invalid message format
    let senders_message = vote_message!([
        recipient_eth_key.as_ref(),
        b":",
        tokens_amount.to_le_bytes().as_ref(),
        b"_",
        transfer_id.as_ref(),
        b"_",
        eth_oracle_address.as_ref(),
    ]
    .concat());

    // Generate data and create senders
    let keys: [[u8; 32]; 3] = rng.gen();
    let operators: [EthereumAddress; 3] = rng.gen();
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

    for item in keys.iter().enumerate() {
        let sender_priv_key = SecretKey::parse(item.1).unwrap();
        let secp_pubkey = PublicKey::from_secret_key(&sender_priv_key);
        let eth_address = construct_eth_pubkey(&secp_pubkey);
        create_sender(
            &mut context,
            &reward_manager.pubkey(),
            &manager_account,
            eth_address,
            operators[item.0],
        )
        .await;
    }

    let mut instructions = Vec::<Instruction>::new();
    // Add 3 messages and bot oracle
    let oracle_sign =
        new_secp256k1_instruction_2_0(&oracle_priv_key, bot_oracle_message.as_ref(), 0);
    instructions.push(oracle_sign);

    for item in keys.iter().enumerate() {
        let priv_key = SecretKey::parse(item.1).unwrap();
        let inst = new_secp256k1_instruction_2_0(
            &priv_key,
            senders_message.as_ref(),
            (2 * item.0 + 1) as u8,
        );
        instructions.push(inst);
        instructions.push(
            instruction::submit_attestations(
                &audius_reward_manager::id(),
                &reward_manager.pubkey(),
                &signers[item.0],
                &context.payer.pubkey(),
                transfer_id.to_string()
            )
            .unwrap(),
        );
    }

    let oracle_sign = new_secp256k1_instruction_2_0(
        &oracle_priv_key,
        bot_oracle_message.as_ref(),
        (keys.len() * 2 + 1) as u8,
    );
    instructions.push(oracle_sign);
    instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &oracle_derived_address,
            &context.payer.pubkey(),
            transfer_id.to_string()
        )
        .unwrap(),
    );

    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await;

    let (_, verified_messages_derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [
            VERIFY_TRANSFER_SEED_PREFIX.as_bytes().as_ref(),
            transfer_id.as_ref(),
        ]
        .concat()
        .as_ref(),
    );

    let recipient_sol_key = claimable_tokens::utils::program::get_address_pair(
        &claimable_tokens::id(),
        &mint.pubkey(),
        recipient_eth_key,
    )
    .unwrap();
    println!("Creating...Recipient sol key = {:?}", &recipient_sol_key.derive.address);
    create_recipient_with_claimable_program(&mut context, &mint.pubkey(), recipient_eth_key).await;
    println!("Created recipient sol key = {:?}", &recipient_sol_key.derive.address);

    let tx = Transaction::new_signed_with_payer(
        &[instruction::evaluate_attestations(
            &audius_reward_manager::id(),
            &verified_messages_derived_address,
            &reward_manager.pubkey(),
            &token_account.pubkey(),
            &recipient_sol_key.derive.address,
            &oracle_derived_address,
            &context.payer.pubkey(),
            10_000u64,
            transfer_id.to_string(),
            recipient_eth_key,
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    let tx_result = context.banks_client.process_transaction(tx).await;
    assert!(tx_result.is_err());
    match tx_result {
        Err(e) if e.to_string() == "transport transaction error: Error processing Instruction 0: custom program error: 0xe" => return (),
        Err(_) => panic!("Returned incorrect error!"),
        Ok(_) => panic!("Incorrectly returned Ok!"),
    }
}

#[tokio::test]
async fn failure_transfer_invalid_oracle_message_format() {
    /* Create verified messages and initialize reward manager */
    let mut program_test = program_test();

    program_test.add_program("claimable_tokens", claimable_tokens::id(), None);
    let mut rng = thread_rng();

    let mut context = program_test.start_with_context().await;

    let mint = Keypair::new();
    let mint_authority = Keypair::new();

    let token_account = Keypair::new();
    let reward_manager = Keypair::new();
    let manager_account = Keypair::new();

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

    // Generate data and create oracle
    let key: [u8; 32] = rng.gen();
    let oracle_priv_key = SecretKey::parse(&key).unwrap();
    let secp_oracle_pubkey = PublicKey::from_secret_key(&oracle_priv_key);
    let eth_oracle_address = construct_eth_pubkey(&secp_oracle_pubkey);
    let oracle_operator: EthereumAddress = rng.gen();

    let (_, oracle_derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [SENDER_SEED_PREFIX.as_ref(), eth_oracle_address.as_ref()]
            .concat()
            .as_ref(),
    );

    create_sender(
        &mut context,
        &reward_manager.pubkey(),
        &manager_account,
        eth_oracle_address,
        oracle_operator,
    )
    .await;

    let tokens_amount = 10_000u64;
    let recipient_eth_key = [7u8; 20];
    let transfer_id = "4r4t23df32543f55";

    mint_tokens_to(
        &mut context,
        &mint.pubkey(),
        &token_account.pubkey(),
        &mint_authority,
        tokens_amount,
    )
    .await
    .unwrap();

    let bot_oracle_message = vote_message!([
        recipient_eth_key.as_ref(),
        b"|",
        tokens_amount.to_le_bytes().as_ref(),
        b"_",
        transfer_id.as_ref(),
    ]
    .concat());

    let senders_message = vote_message!([
        recipient_eth_key.as_ref(),
        b"_",
        tokens_amount.to_le_bytes().as_ref(),
        b"_",
        transfer_id.as_ref(),
        b"_",
        eth_oracle_address.as_ref(),
    ]
    .concat());

    // Generate data and create senders
    let keys: [[u8; 32]; 3] = rng.gen();
    let operators: [EthereumAddress; 3] = rng.gen();
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

    for item in keys.iter().enumerate() {
        let sender_priv_key = SecretKey::parse(item.1).unwrap();
        let secp_pubkey = PublicKey::from_secret_key(&sender_priv_key);
        let eth_address = construct_eth_pubkey(&secp_pubkey);
        create_sender(
            &mut context,
            &reward_manager.pubkey(),
            &manager_account,
            eth_address,
            operators[item.0],
        )
        .await;
    }

    let mut instructions = Vec::<Instruction>::new();
    // Add 3 messages and bot oracle
    let oracle_sign =
        new_secp256k1_instruction_2_0(&oracle_priv_key, bot_oracle_message.as_ref(), 0);
    instructions.push(oracle_sign);

    for item in keys.iter().enumerate() {
        let priv_key = SecretKey::parse(item.1).unwrap();
        let inst = new_secp256k1_instruction_2_0(
            &priv_key,
            senders_message.as_ref(),
            (2 * item.0 + 1) as u8,
        );
        instructions.push(inst);
        instructions.push(
            instruction::submit_attestations(
                &audius_reward_manager::id(),
                &reward_manager.pubkey(),
                &signers[item.0],
                &context.payer.pubkey(),
                transfer_id.to_string()
            )
            .unwrap(),
        );
    }

    let oracle_sign = new_secp256k1_instruction_2_0(
        &oracle_priv_key,
        bot_oracle_message.as_ref(),
        (keys.len() * 2 + 1) as u8,
    );
    instructions.push(oracle_sign);
    instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &oracle_derived_address,
            &context.payer.pubkey(),
            transfer_id.to_string()
        )
        .unwrap(),
    );

    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await;

    let (_, verified_messages_derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [
            VERIFY_TRANSFER_SEED_PREFIX.as_bytes().as_ref(),
            transfer_id.as_ref(),
        ]
        .concat()
        .as_ref(),
    );

    let recipient_sol_key = claimable_tokens::utils::program::get_address_pair(
        &claimable_tokens::id(),
        &mint.pubkey(),
        recipient_eth_key,
    )
    .unwrap();
    println!("Creating...Recipient sol key = {:?}", &recipient_sol_key.derive.address);
    create_recipient_with_claimable_program(&mut context, &mint.pubkey(), recipient_eth_key).await;
    println!("Created recipient sol key = {:?}", &recipient_sol_key.derive.address);

    let tx = Transaction::new_signed_with_payer(
        &[instruction::evaluate_attestations(
            &audius_reward_manager::id(),
            &verified_messages_derived_address,
            &reward_manager.pubkey(),
            &token_account.pubkey(),
            &recipient_sol_key.derive.address,
            &oracle_derived_address,
            &context.payer.pubkey(),
            10_000u64,
            transfer_id.to_string(),
            recipient_eth_key,
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    let tx_result = context.banks_client.process_transaction(tx).await;
    assert!(tx_result.is_err());
    match tx_result {
        Err(e) if e.to_string() == "transport transaction error: Error processing Instruction 0: custom program error: 0xe" => return (),
        Err(_) => panic!("Returned incorrect error!"),
        Ok(_) => panic!("Incorrectly returned Ok!"),
    }
}

#[tokio::test]
async fn failure_transfer_incorrect_number_of_verified_messages() {
    /* Create verified messages and initialize reward manager */
    let mut program_test = program_test();

    program_test.add_program("claimable_tokens", claimable_tokens::id(), None);
    let mut rng = thread_rng();

    let mut context = program_test.start_with_context().await;

    let mint = Keypair::new();
    let mint_authority = Keypair::new();

    let token_account = Keypair::new();
    let reward_manager = Keypair::new();
    let manager_account = Keypair::new();

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

    // Generate data and create oracle
    let key: [u8; 32] = rng.gen();
    let oracle_priv_key = SecretKey::parse(&key).unwrap();
    let secp_oracle_pubkey = PublicKey::from_secret_key(&oracle_priv_key);
    let eth_oracle_address = construct_eth_pubkey(&secp_oracle_pubkey);
    let oracle_operator: EthereumAddress = rng.gen();

    let (_, oracle_derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [SENDER_SEED_PREFIX.as_ref(), eth_oracle_address.as_ref()]
            .concat()
            .as_ref(),
    );

    create_sender(
        &mut context,
        &reward_manager.pubkey(),
        &manager_account,
        eth_oracle_address,
        oracle_operator,
    )
    .await;

    let tokens_amount = 10_000u64;
    let recipient_eth_key = [7u8; 20];
    let transfer_id = "4r4t23df32543f55";

    mint_tokens_to(
        &mut context,
        &mint.pubkey(),
        &token_account.pubkey(),
        &mint_authority,
        tokens_amount,
    )
    .await
    .unwrap();

    let bot_oracle_message = vote_message!([
        recipient_eth_key.as_ref(),
        b"_",
        tokens_amount.to_le_bytes().as_ref(),
        b"_",
        transfer_id.as_ref(),
    ]
    .concat());

    let senders_message = vote_message!([
        recipient_eth_key.as_ref(),
        b"_",
        tokens_amount.to_le_bytes().as_ref(),
        b"_",
        transfer_id.as_ref(),
        b"_",
        eth_oracle_address.as_ref(),
    ]
    .concat());

    // Generate data and create senders
    let keys: [[u8; 32]; 3] = rng.gen();
    let operators: [EthereumAddress; 3] = rng.gen();
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

    for item in keys.iter().enumerate() {
        let sender_priv_key = SecretKey::parse(item.1).unwrap();
        let secp_pubkey = PublicKey::from_secret_key(&sender_priv_key);
        let eth_address = construct_eth_pubkey(&secp_pubkey);
        create_sender(
            &mut context,
            &reward_manager.pubkey(),
            &manager_account,
            eth_address,
            operators[item.0],
        )
        .await;
    }

    let mut instructions = Vec::<Instruction>::new();
    // Add 3 messages and bot oracle
    let oracle_sign =
        new_secp256k1_instruction_2_0(&oracle_priv_key, bot_oracle_message.as_ref(), 0);
    instructions.push(oracle_sign);

    for item in keys.iter().enumerate() {
        let priv_key = SecretKey::parse(item.1).unwrap();
        let inst = new_secp256k1_instruction_2_0(
            &priv_key,
            senders_message.as_ref(),
            (2 * item.0 + 1) as u8,
        );
        instructions.push(inst);
        instructions.push(
            instruction::submit_attestations(
                &audius_reward_manager::id(),
                &reward_manager.pubkey(),
                &signers[item.0],
                &context.payer.pubkey(),
                transfer_id.to_string()
            )
            .unwrap(),
        );
    }

    instructions.push(
        instruction::submit_attestations(
            &audius_reward_manager::id(),
            &reward_manager.pubkey(),
            &oracle_derived_address,
            &context.payer.pubkey(),
            transfer_id.to_string()
        )
        .unwrap(),
    );

    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    // intentionally not push oracle instruction above and process transaction
    let tx_result = context.banks_client.process_transaction(tx).await;
    assert!(tx_result.is_err());
    match tx_result {
        Err(e) if e.to_string() == "transport transaction error: Error processing Instruction 7: custom program error: 0x8" => return (),
        Err(_) => panic!("Returned incorrect error!"),
        Ok(_) => panic!("Incorrectly returned Ok!"),
    }
}

// Helpers

fn get_transfer_account(reward_manager: &Keypair, transfer_id: &str) -> Pubkey {
    let (_, transfer_derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [
            TRANSFER_SEED_PREFIX.as_bytes().as_ref(),
            transfer_id.as_ref(),
        ]
        .concat()
        .as_ref(),
    );
    transfer_derived_address
}

fn get_messages_account(reward_manager: &Keypair, transfer_id: &str) -> Pubkey {
    let (_, verified_messages_derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [
            VERIFY_TRANSFER_SEED_PREFIX.as_bytes().as_ref(),
            transfer_id.as_ref(),
        ]
        .concat()
        .as_ref(),
    );
    verified_messages_derived_address
}

fn get_oracle_address(reward_manager: &Keypair, eth_oracle_address: [u8; 20]) -> Pubkey {
    let (_, oracle_derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [SENDER_SEED_PREFIX.as_ref(), eth_oracle_address.as_ref()]
            .concat()
            .as_ref(),
    );
    oracle_derived_address
}

async fn create_sender_from(
    reward_manager: &Keypair,
    manager_account: &Keypair,
    context: &mut ProgramTestContext,
    key: &[u8; 32],
    operator: [u8; 20]) -> Pubkey {
    let sender_priv_key = SecretKey::parse(key).unwrap();
    let secp_pubkey = PublicKey::from_secret_key(&sender_priv_key);
    let eth_address = construct_eth_pubkey(&secp_pubkey);

    let (_, derived_address, _) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        [SENDER_SEED_PREFIX.as_ref(), eth_address.as_ref()]
            .concat()
            .as_ref(),
    );

    create_sender(
        context,
        &reward_manager.pubkey(),
        &manager_account,
        eth_address,
        operator
    )
    .await;

    derived_address
}