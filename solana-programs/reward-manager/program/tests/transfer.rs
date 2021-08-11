#![cfg(feature = "test-bpf")]
mod assert;
mod utils;

use audius_reward_manager::{
    instruction,
    processor::{SENDER_SEED_PREFIX, TRANSFER_ACC_SPACE, TRANSFER_SEED_PREFIX},
    state::VerifiedMessages,
    utils::{find_derived_pair, EthereumAddress},
    vote_message,
};
use libsecp256k1::{PublicKey, SecretKey};
use rand::{thread_rng, Rng};
use solana_program::{
    instruction::Instruction, program_pack::Pack, pubkey::Pubkey, system_instruction,
};
use solana_program_test::*;
use solana_sdk::{
    secp256k1_instruction::*, signature::Keypair, signer::Signer, transaction::Transaction,
};
use std::mem::MaybeUninit;
use utils::*;
/*

#[tokio::test]
async fn success() {
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

    let verified_messages = Keypair::new();

    let tx = Transaction::new_signed_with_payer(
        &[system_instruction::create_account(
            &context.payer.pubkey(),
            &verified_messages.pubkey(),
            rent.minimum_balance(VerifiedMessages::LEN),
            VerifiedMessages::LEN as u64,
            &audius_reward_manager::id(),
        )],
        Some(&context.payer.pubkey()),
        &[&context.payer, &verified_messages],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();

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
            instruction::verify_transfer_signature(
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
        instruction::verify_transfer_signature(
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

    let recipient_sol_key = claimable_tokens::utils::program::get_address_pair(
        &claimable_tokens::id(),
        &mint.pubkey(),
        recipient_eth_key,
    )
    .unwrap();
    create_recipient_with_claimable_program(&mut context, &mint.pubkey(), recipient_eth_key).await;

    let tx = Transaction::new_signed_with_payer(
        &[instruction::transfer(
            &audius_reward_manager::id(),
            &verified_messages.pubkey(),
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

    let transfer_account_data = get_account(&mut context, &transfer_derived_address)
        .await
        .unwrap();

    assert_eq!(
        transfer_account_data.lamports,
        rent.minimum_balance(TRANSFER_ACC_SPACE)
    );
    assert_eq!(transfer_account_data.data.len(), TRANSFER_ACC_SPACE);
}

*/
