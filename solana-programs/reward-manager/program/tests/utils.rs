#![cfg(feature = "test-bpf")]
#![allow(dead_code)]

use audius_reward_manager::{instruction, vote_message, processor::{SENDER_SEED_PREFIX, VERIFY_TRANSFER_SEED_PREFIX}};
use audius_reward_manager::utils::{EthereumAddress, find_derived_pair};
use audius_reward_manager::{id, processor::Processor};
use claimable_tokens::utils::program::AddressPair;
use sha3::Digest;
use solana_program::{
    instruction::Instruction, program_pack::Pack, pubkey::Pubkey, rent::Rent, system_instruction,
};
use solana_program_test::*;
use solana_program_test::{processor, ProgramTest};
use solana_sdk::secp256k1_instruction::*;
use solana_sdk::transaction::TransactionError;
use solana_sdk::{
    account::Account,
    signature::{Keypair, Signer},
    transaction::Transaction,
    transport::TransportError,
};
use audius_reward_manager::error::AudiusProgramError;
use solana_program::instruction::InstructionError;
use rand::{Rng, prelude::ThreadRng, thread_rng};
use libsecp256k1::{PublicKey, SecretKey};

pub fn program_test() -> ProgramTest {
    ProgramTest::new(
        "audius_reward_manager",
        id(),
        processor!(Processor::process_instruction),
    )
}

pub async fn get_account(
    program_context: &mut ProgramTestContext,
    pubkey: &Pubkey,
) -> Option<Account> {
    program_context
        .banks_client
        .get_account(*pubkey)
        .await
        .expect("account not found")
}

pub fn new_secp256k1_instruction_2_0(
    priv_key: &libsecp256k1::SecretKey,
    message_arr: &[u8],
    instruction_index: u8,
) -> Instruction {
    let secp_pubkey = libsecp256k1::PublicKey::from_secret_key(priv_key);
    let eth_pubkey = construct_eth_pubkey(&secp_pubkey);
    let mut hasher = sha3::Keccak256::new();
    hasher.update(&message_arr);
    let message_hash = hasher.finalize();
    let mut message_hash_arr = [0u8; 32];
    message_hash_arr.copy_from_slice(&message_hash.as_slice());
    let message = libsecp256k1::Message::parse(&message_hash_arr);
    let (signature, recovery_id) = libsecp256k1::sign(&message, priv_key);
    let signature_arr = signature.serialize();
    assert_eq!(signature_arr.len(), SIGNATURE_SERIALIZED_SIZE);

    let mut instruction_data = vec![];
    instruction_data.resize(
        DATA_START
            .saturating_add(eth_pubkey.len())
            .saturating_add(signature_arr.len())
            .saturating_add(message_arr.len())
            .saturating_add(1),
        0,
    );
    let eth_address_offset = DATA_START;
    instruction_data[eth_address_offset..eth_address_offset.saturating_add(eth_pubkey.len())]
        .copy_from_slice(&eth_pubkey);

    let signature_offset = DATA_START.saturating_add(eth_pubkey.len());
    instruction_data[signature_offset..signature_offset.saturating_add(signature_arr.len())]
        .copy_from_slice(&signature_arr);

    instruction_data[signature_offset.saturating_add(signature_arr.len())] =
        recovery_id.serialize();

    let message_data_offset = signature_offset
        .saturating_add(signature_arr.len())
        .saturating_add(1);
    instruction_data[message_data_offset..].copy_from_slice(message_arr);

    let num_signatures = 1;
    instruction_data[0] = num_signatures;
    let offsets = SecpSignatureOffsets {
        signature_offset: signature_offset as u16,
        signature_instruction_index: instruction_index,
        eth_address_offset: eth_address_offset as u16,
        eth_address_instruction_index: instruction_index,
        message_data_offset: message_data_offset as u16,
        message_data_size: message_arr.len() as u16,
        message_instruction_index: instruction_index,
    };
    let writer = std::io::Cursor::new(&mut instruction_data[1..DATA_START]);
    bincode::serialize_into(writer, &offsets).unwrap();

    Instruction {
        program_id: solana_sdk::secp256k1_program::id(),
        accounts: vec![],
        data: instruction_data,
    }
}

pub async fn create_sender(
    context: &mut ProgramTestContext,
    reward_manager: &Pubkey,
    manager_acc: &Keypair,
    eth_address: EthereumAddress,
    operator: EthereumAddress,
) {
    let tx = Transaction::new_signed_with_payer(
        &[instruction::create_sender(
            &audius_reward_manager::id(),
            reward_manager,
            &manager_acc.pubkey(),
            &context.payer.pubkey(),
            eth_address,
            operator,
        )
        .unwrap()],
        Some(&context.payer.pubkey()),
        &[&context.payer, manager_acc],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();
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


pub async fn init_reward_manager(
    context: &mut ProgramTestContext,
    reward_manager: &Keypair,
    token_account: &Keypair,
    mint: &Pubkey,
    manager: &Pubkey,
    min_votes: u8,
) {
    let rent = context.banks_client.get_rent().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[
            system_instruction::create_account(
                &context.payer.pubkey(),
                &reward_manager.pubkey(),
                rent.minimum_balance(audius_reward_manager::state::RewardManager::LEN),
                audius_reward_manager::state::RewardManager::LEN as _,
                &audius_reward_manager::id(),
            ),
            system_instruction::create_account(
                &context.payer.pubkey(),
                &token_account.pubkey(),
                rent.minimum_balance(spl_token::state::Account::LEN),
                spl_token::state::Account::LEN as _,
                &spl_token::id(),
            ),
            instruction::init(
                &audius_reward_manager::id(),
                &reward_manager.pubkey(),
                &token_account.pubkey(),
                mint,
                &manager,
                min_votes,
            )
            .unwrap(),
        ],
        Some(&context.payer.pubkey()),
        &[&context.payer, reward_manager, token_account],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();
}

pub async fn create_mint(
    program_context: &mut ProgramTestContext,
    mint_account: &Keypair,
    mint_rent: u64,
    authority: &Pubkey,
) -> Result<(), TransportError> {
    let instructions = vec![
        system_instruction::create_account(
            &program_context.payer.pubkey(),
            &mint_account.pubkey(),
            mint_rent,
            spl_token::state::Mint::LEN as u64,
            &spl_token::id(),
        ),
        spl_token::instruction::initialize_mint(
            &spl_token::id(),
            &mint_account.pubkey(),
            authority,
            None,
            0,
        )
        .unwrap(),
    ];

    let mut transaction =
        Transaction::new_with_payer(&instructions, Some(&program_context.payer.pubkey()));

    transaction.sign(
        &[&program_context.payer, mint_account],
        program_context.last_blockhash,
    );
    program_context
        .banks_client
        .process_transaction(transaction)
        .await?;
    Ok(())
}

pub async fn create_token_account(
    program_context: &mut ProgramTestContext,
    account: &Keypair,
    mint: &Pubkey,
    owner: &Pubkey,
    rent: &Rent,
) -> Result<(), TransportError> {
    let account_rent = rent.minimum_balance(spl_token::state::Account::LEN);

    let instructions = vec![
        system_instruction::create_account(
            &program_context.payer.pubkey(),
            &account.pubkey(),
            account_rent,
            spl_token::state::Account::LEN as u64,
            &spl_token::id(),
        ),
        spl_token::instruction::initialize_account(
            &spl_token::id(),
            &account.pubkey(),
            mint,
            owner,
        )
        .unwrap(),
    ];

    let mut transaction =
        Transaction::new_with_payer(&instructions, Some(&program_context.payer.pubkey()));

    transaction.sign(
        &[&program_context.payer, account],
        program_context.last_blockhash,
    );
    program_context
        .banks_client
        .process_transaction(transaction)
        .await?;
    Ok(())
}

pub async fn mint_tokens_to(
    program_context: &mut ProgramTestContext,
    mint: &Pubkey,
    destination: &Pubkey,
    authority: &Keypair,
    amount: u64,
) -> Result<(), TransportError> {
    let mut transaction = Transaction::new_with_payer(
        &[spl_token::instruction::mint_to(
            &spl_token::id(),
            mint,
            destination,
            &authority.pubkey(),
            &[&authority.pubkey()],
            amount,
        )
        .unwrap()],
        Some(&program_context.payer.pubkey()),
    );
    transaction.sign(
        &[&program_context.payer, authority],
        program_context.last_blockhash,
    );
    program_context
        .banks_client
        .process_transaction(transaction)
        .await?;
    Ok(())
}

pub async fn create_recipient_with_claimable_program(
    program_context: &mut ProgramTestContext,
    mint: &Pubkey,
    eth_address: EthereumAddress,
) {
    let mut transaction = Transaction::new_with_payer(
        &[claimable_tokens::instruction::init(
            &claimable_tokens::id(),
            &program_context.payer.pubkey(),
            mint,
            claimable_tokens::instruction::CreateTokenAccount { eth_address },
        )
        .unwrap()],
        Some(&program_context.payer.pubkey()),
    );
    transaction.sign(&[&program_context.payer], program_context.last_blockhash);
    program_context
        .banks_client
        .process_transaction(transaction)
        .await
        .unwrap();
}

pub fn assert_custom_error(res: Result<(), TransportError>, instruction_index: u8, audius_error: AudiusProgramError) {
    match res {
        Err(TransportError::TransactionError(TransactionError::InstructionError(idx, InstructionError::Custom(v)))) => {
            assert_eq!(idx, instruction_index);
            assert_eq!(v, audius_error as u32);
        },
        _ => panic!("Expected error")
    }
}

pub struct TestConstants<'a> {
    pub reward_manager: Keypair,
    pub bot_oracle_message: [u8; 128],
    pub oracle_priv_key: SecretKey,
    pub senders_message: [u8; 128],
    pub context: ProgramTestContext,
    pub transfer_id: &'a str,
    pub oracle_derived_address: Pubkey,
    pub mint: Keypair, 
    pub recipient_eth_key: [u8; 20],
    pub token_account: Keypair,
    pub rent: Rent,
    pub rng: ThreadRng,
    pub manager_account: Keypair,
    pub tokens_amount: u64,
    pub eth_oracle_address: [u8;20], 
    pub recipient_sol_key: AddressPair,
    pub min_votes: u8,
    pub oracle_operator: [u8;20],
}

pub async fn setup_test_environment<'a>() -> TestConstants<'a> {
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
    let min_votes: u8 = 3;

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
        min_votes,
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


    // Make recipient token account

    let recipient_sol_key = claimable_tokens::utils::program::find_address_pair(
        &claimable_tokens::id(),
        &mint.pubkey(),
        recipient_eth_key,
    )
    .unwrap();
    println!("Creating...Recipient sol key = {:?}", &recipient_sol_key.derive.address);
    create_recipient_with_claimable_program(&mut context, &mint.pubkey(), recipient_eth_key).await;
    println!("Created recipient sol key = {:?}", &recipient_sol_key.derive.address);

    return TestConstants {
        reward_manager,
        bot_oracle_message,
        oracle_priv_key,
        senders_message,
        context,
        transfer_id,
        oracle_derived_address,
        mint, 
        recipient_eth_key,
        token_account,
        rent,
        rng,
        manager_account,
        tokens_amount,
        eth_oracle_address, 
        recipient_sol_key,
        min_votes,
        oracle_operator,
    }
}

pub async fn create_sender_from(
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

pub fn get_messages_account(reward_manager: &Keypair, transfer_id: &str) -> Pubkey {
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