#![cfg(feature = "test-bpf")]
mod utils;

use audius_reward_manager::{
    instruction,
    processor::SENDER_SEED_PREFIX,
    processor::VERIFY_TRANSFER_SEED_PREFIX,
    state::VerifiedMessages,
    utils::{find_derived_pair, EthereumAddress},
    vote_message,
};
use libsecp256k1::{PublicKey, SecretKey};
use rand::{thread_rng, Rng};
use solana_program::{instruction::Instruction, program_pack::Pack, pubkey::Pubkey, system_instruction};
use solana_program_test::*;
use solana_sdk::{
    secp256k1_instruction::*, signature::Keypair, signer::Signer, transaction::Transaction,
};
use std::mem::MaybeUninit;
use utils::*;

#[tokio::test]
async fn success_verify_transfer_signature() {
    let program_test = program_test();
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

    let tokens_amount = 10_000u64;
    let recipient_eth_key = [7u8; 20];
    let transfer_id = "4r4t23df32543f55";

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

    mint_tokens_to(
        &mut context,
        &mint.pubkey(),
        &token_account.pubkey(),
        &mint_authority,
        tokens_amount,
    )
    .await
    .unwrap();

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
    let program_test = program_test();
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

    let tokens_amount = 10_000u64;
    let recipient_eth_key = [7u8; 20];
    let transfer_id = "4r4t23df32543f55";

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

    let bot_oracle_msg = vote_message!([
        recipient_eth_key.as_ref(),
        b"_",
        tokens_amount.to_le_bytes().as_ref(),
        b"_",
        transfer_id.as_ref(),
    ]
    .concat());
    // Add bot oracle as sender
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
    println!("Created bot oracle sender - {:?}", oracle_derived_address);

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

    // Mint tokens to reward manager token acct 
    mint_tokens_to(
        &mut context,
        &mint.pubkey(),
        &token_account.pubkey(),
        &mint_authority,
        tokens_amount,
    )
    .await
    .unwrap();

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
    let oracle_sign = new_secp256k1_instruction_2_0(&oracle_priv_key, bot_oracle_msg.as_ref(), 4);
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

    let verified_messages_account_seed = [
        VERIFY_TRANSFER_SEED_PREFIX.as_bytes().as_ref(),
        transfer_id.as_ref(),
    ].concat();
    // Calculate verified messages derived account
    let (reward_manager_authority, verified_msgs_derived_acct, bump_seed) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        verified_messages_account_seed
        .as_ref(),
    );

    // Confirm vote submission occurred
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
            assert_eq!(x.message, bot_oracle_msg);
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
    let mut rng = thread_rng();

    let mut context = program_test.start_with_context().await;

    let mint = Keypair::new();
    let mint_authority = Keypair::new();

    let token_account = Keypair::new();
    let reward_manager = Keypair::new();
    let manager_account = Keypair::new();
    let transfer_id = "4r4t23df32543f55";

    let rent = context.banks_client.get_rent().await.unwrap();
    let verified_messages_account_seed = [
        VERIFY_TRANSFER_SEED_PREFIX.as_bytes().as_ref(),
        transfer_id.as_ref(),
    ].concat();
    // Calculate verified messages derived account
    let (reward_manager_authority, verified_msgs_derived_acct, bump_seed) = find_derived_pair(
        &audius_reward_manager::id(),
        &reward_manager.pubkey(),
        verified_messages_account_seed
        .as_ref(),
    );

    // Recreate signers seeds
    let signers_seeds = &[
        &reward_manager_authority.to_bytes()[..32],
        verified_messages_account_seed.as_slice(),
        &[bump_seed],
    ];

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
    println!("NEW CASE 2");

    failed_tx.sign(&[&context.payer], recent_blockhash);
    let failed_tx_result = context.banks_client.process_transaction(failed_tx).await.map_err(|err| {
        println!("{:?}", err);
    });
}