#![cfg(feature = "test-bpf")]

use claimable_tokens::error::ClaimableProgramError;
use claimable_tokens::utils::program::{get_address_pair, EthereumAddress};
use claimable_tokens::*;
use rand::prelude::ThreadRng;
use rand::{thread_rng, Rng};
use libsecp256k1::{PublicKey, SecretKey};
use solana_program::instruction::InstructionError;
use solana_program::{program_pack::Pack, pubkey::Pubkey, system_instruction};
use solana_program_test::*;
use solana_sdk::transaction::TransactionError;
use solana_sdk::{
    account::Account,
    secp256k1_instruction::{construct_eth_pubkey, new_secp256k1_instruction},
    signature::{Keypair, Signer},
    transaction::Transaction,
    transport::TransportError,
};
// construct_eth_pubkey
pub fn program_test() -> ProgramTest {
    ProgramTest::new(
        "claimable_tokens",
        id(),
        processor!(processor::Processor::process_instruction),
    )
}

// Initialize common test variables in one place
pub fn init_test_variables() -> (ThreadRng, [u8;32], SecretKey, PublicKey, Keypair, Keypair, Keypair, [u8;20]) {
    let mut rng = thread_rng();
    let key: [u8; 32] = rng.gen();
    let priv_key = SecretKey::parse(&key).unwrap();
    let secp_pubkey = PublicKey::from_secret_key(&priv_key);
    let eth_address = construct_eth_pubkey(&secp_pubkey);
    let mint_account = Keypair::new();
    let mint_authority = Keypair::new();
    let user_token_account = Keypair::new();
    return (
        rng,
        key,
        priv_key,
        secp_pubkey,
        mint_account,
        mint_authority,
        user_token_account,
        eth_address
    )
}

fn assert_custom_error(res: Result<(), TransportError>, instruction_index: u8, audius_error: ClaimableProgramError) {
    match res {
        Err(
            TransportError::TransactionError(TransactionError::InstructionError(idx, InstructionError::Custom(v)))
        ) => {
            assert_eq!(idx, instruction_index);
            assert_eq!(v, audius_error as u32);
        },
        _ => panic!("Expected error not found")
    }
}

pub async fn get_account(program_context: &mut ProgramTestContext, pubkey: &Pubkey) -> Account {
    program_context
        .banks_client
        .get_account(*pubkey)
        .await
        .expect("account not found")
        .expect("account empty")
}

async fn create_token_account(
    program_context: &mut ProgramTestContext,
    account: &Keypair,
    account_rent: u64,
    mint: &Pubkey,
    owner: &Pubkey,
) -> Result<(), TransportError> {
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

async fn create_mint(
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

async fn init_user_bank(
    program_context: &mut ProgramTestContext,
    mint: &Pubkey,
    eth_address: EthereumAddress,
) -> Result<(), TransportError> {
    let mut transaction = Transaction::new_with_payer(
        &[instruction::init(
            &id(),
            &program_context.payer.pubkey(),
            mint,
            instruction::CreateTokenAccount { eth_address },
        )
        .unwrap()],
        Some(&program_context.payer.pubkey()),
    );

    transaction.sign(&[&program_context.payer], program_context.last_blockhash);
    program_context
        .banks_client
        .process_transaction(transaction)
        .await
}

async fn prepare_claim(
    program_context: &mut ProgramTestContext,
    mint_account: Keypair,
    rent: solana_program::rent::Rent,
    mint_authority: Keypair,
    eth_address: EthereumAddress,
    user_token_account: &Keypair,
) -> (Pubkey, Pubkey, u64) {
    create_mint(
        program_context,
        &mint_account,
        rent.minimum_balance(spl_token::state::Mint::LEN),
        &mint_authority.pubkey(),
    )
    .await
    .unwrap();

    let pair = get_address_pair(
        &id(), 
        &mint_account.pubkey(),
        eth_address).unwrap();

    init_user_bank(program_context, &mint_account.pubkey(), eth_address)
        .await
        .unwrap();
    let tokens_amount = 10_000;
    mint_tokens_to(
        program_context,
        &mint_account.pubkey(),
        &pair.derive.address,
        &mint_authority,
        tokens_amount,
    )
    .await
    .unwrap();
    let user_token_account_authority = Keypair::new();
    create_token_account(
        program_context,
        user_token_account,
        rent.minimum_balance(spl_token::state::Account::LEN),
        &mint_account.pubkey(),
        &user_token_account_authority.pubkey(),
    )
    .await
    .unwrap();

    (pair.base.address, pair.derive.address, tokens_amount)
}

#[tokio::test]
async fn test_init_instruction() {
    let mut program_context = program_test().start_with_context().await;
    let rent = program_context.banks_client.get_rent().await.unwrap();
    let (
        _rng,
        _key,
        _priv_key,
        _secp_pubkey,
        mint_account,
        mint_authority,
        _user_token_account,
        eth_address
    ) = init_test_variables();

    create_mint(
        &mut program_context,
        &mint_account,
        rent.minimum_balance(spl_token::state::Mint::LEN),
        &mint_authority.pubkey(),
    )
    .await
    .unwrap();

    let pair = get_address_pair(&id(), &mint_account.pubkey(), eth_address).unwrap();

    init_user_bank(&mut program_context, &mint_account.pubkey(), eth_address)
        .await
        .unwrap();

    let token_account_data = get_account(&mut program_context, &pair.derive.address).await;
    // check that token account is initialized
    let token_account =
        spl_token::state::Account::unpack(&token_account_data.data.as_slice()).unwrap();

    assert_eq!(token_account.mint, mint_account.pubkey());
}

#[tokio::test]
async fn test_claim_all_instruction() {
    let mut program_context = program_test().start_with_context().await;
    let rent = program_context.banks_client.get_rent().await.unwrap();
    let (
        _rng,
        _key,
        priv_key,
        _secp_pubkey,
        mint_account,
        mint_authority,
        user_token_account,
        eth_address
    ) = init_test_variables();

    let message = user_token_account.pubkey().to_bytes();
    let secp256_program_instruction = new_secp256k1_instruction(&priv_key, &message);

    let (base_acc, address_to_create, tokens_amount) = prepare_claim(
        &mut program_context,
        mint_account,
        rent,
        mint_authority,
        eth_address,
        &user_token_account,
    )
    .await;

    // Query current balance
    let mut bank_token_account_data = get_account(&mut program_context, &address_to_create).await;
    let mut bank_token_account =
        spl_token::state::Account::unpack(&bank_token_account_data.data.as_slice()).unwrap();
    println!(
        "{:?} current balance = {:?} ",
        bank_token_account.amount,
        address_to_create
    );

    // Transfer ALL tokens
    let mut transaction = Transaction::new_with_payer(
        &[
            secp256_program_instruction,
            instruction::transfer(
                &id(),
                &address_to_create,
                &user_token_account.pubkey(),
                &base_acc,
                instruction::Transfer {
                    eth_address,
                    amount: bank_token_account.amount,
                },
            )
            .unwrap(),
        ],
        Some(&program_context.payer.pubkey()),
    );

    transaction.sign(&[&program_context.payer], program_context.last_blockhash);
    program_context
        .banks_client
        .process_transaction(transaction)
        .await
        .unwrap();

    bank_token_account_data = get_account(&mut program_context, &address_to_create).await;
    bank_token_account =
        spl_token::state::Account::unpack(&bank_token_account_data.data.as_slice()).unwrap();
    // check that program sent all the tokens from bank token account to user token account
    assert_eq!(bank_token_account.amount, 0);

    let user_token_account_data =
        get_account(&mut program_context, &user_token_account.pubkey()).await;
    let user_token_account =
        spl_token::state::Account::unpack(&user_token_account_data.data.as_slice()).unwrap();

    assert_eq!(user_token_account.amount, tokens_amount);
}

#[tokio::test]
async fn test_claim_with_amount_instruction() {
    let mut program_context = program_test().start_with_context().await;
    let rent = program_context.banks_client.get_rent().await.unwrap();
    let (
        _rng,
        _key,
        priv_key,
        _secp_pubkey,
        mint_account,
        mint_authority,
        user_token_account,
        eth_address
    ) = init_test_variables();

    let message = user_token_account.pubkey().to_bytes();
    let secp256_program_instruction = new_secp256k1_instruction(&priv_key, &message);
    let (base_acc, address_to_create, tokens_amount) = prepare_claim(
        &mut program_context,
        mint_account,
        rent,
        mint_authority,
        eth_address,
        &user_token_account,
    )
    .await;
    let transfer_amount = rand::thread_rng().gen_range(1..tokens_amount);

    let mut transaction = Transaction::new_with_payer(
        &[
            secp256_program_instruction,
            instruction::transfer(
                &id(),
                &address_to_create,
                &user_token_account.pubkey(),
                &base_acc,
                instruction::Transfer {
                    eth_address,
                    amount: transfer_amount,
                },
            )
            .unwrap(),
        ],
        Some(&program_context.payer.pubkey()),
    );

    transaction.sign(&[&program_context.payer], program_context.last_blockhash);
    program_context
        .banks_client
        .process_transaction(transaction)
        .await
        .unwrap();

    let bank_token_account_data = get_account(&mut program_context, &address_to_create).await;
    let bank_token_account =
        spl_token::state::Account::unpack(&bank_token_account_data.data.as_slice()).unwrap();
    // check that program sent required number tokens from bank token account to user token account
    assert_eq!(bank_token_account.amount, tokens_amount - transfer_amount);

    let user_token_account_data =
        get_account(&mut program_context, &user_token_account.pubkey()).await;
    let user_token_account =
        spl_token::state::Account::unpack(&user_token_account_data.data.as_slice()).unwrap();

    assert_eq!(user_token_account.amount, transfer_amount);
}

#[tokio::test]
async fn test_claim_with_zero_amount_failure() {
    let mut program_context = program_test().start_with_context().await;
    let rent = program_context.banks_client.get_rent().await.unwrap();
    let (
        _rng,
        _key,
        priv_key,
        _secp_pubkey,
        mint_account,
        mint_authority,
        user_token_account,
        eth_address
    ) = init_test_variables();

    let message = user_token_account.pubkey().to_bytes();
    let secp256_program_instruction = new_secp256k1_instruction(&priv_key, &message);
    let (base_acc, address_to_create, _tokens_amount) = prepare_claim(
        &mut program_context,
        mint_account,
        rent,
        mint_authority,
        eth_address,
        &user_token_account,
    )
    .await;
    let transfer_amount = 0;
    let mut transaction = Transaction::new_with_payer(
        &[
            secp256_program_instruction,
            instruction::transfer(
                &id(),
                &address_to_create,
                &user_token_account.pubkey(),
                &base_acc,
                instruction::Transfer {
                    eth_address,
                    amount: transfer_amount,
                },
            )
            .unwrap(),
        ],
        Some(&program_context.payer.pubkey()),
    );
    transaction.sign(&[&program_context.payer], program_context.last_blockhash);
    let tx_result = program_context
        .banks_client
        .process_transaction(transaction)
        .await;
    assert!(tx_result.is_err());
    // Confirm a transfer of 0 is not permitted
    match tx_result {
        Err(
            TransportError::TransactionError(
                TransactionError::InstructionError(_idx, InstructionError::InsufficientFunds)
            )
        ) => {
            println!("Insufficient funds error found as expected: {:?}", tx_result);
        },
        _ => panic!("Unexpected error scenario")
    }
}

#[tokio::test]
async fn test_claim_with_wrong_signature_instruction() {
    let mut program_context = program_test().start_with_context().await;
    let rent = program_context.banks_client.get_rent().await.unwrap();
    let (
        _rng,
        _key,
        priv_key,
        _secp_pubkey,
        mint_account,
        mint_authority,
        user_token_account,
        eth_address
    ) = init_test_variables();

    // Use bad bad_message instead of the user token account pubkey for the program instruction
    let bad_message = [8u8; 30];
    let secp256_program_instruction = new_secp256k1_instruction(&priv_key, &bad_message);

    let (base_acc, address_to_create, tokens_amount) = prepare_claim(
        &mut program_context,
        mint_account,
        rent,
        mint_authority,
        eth_address,
        &user_token_account,
    )
    .await;

    let mut transaction = Transaction::new_with_payer(
        &[
            secp256_program_instruction,
            instruction::transfer (
                &id(),
                &address_to_create,
                &user_token_account.pubkey(),
                &base_acc,
                instruction::Transfer {
                    eth_address,
                    amount: 0,
                },
            )
            .unwrap(),
        ],
        Some(&program_context.payer.pubkey()),
    );

    transaction.sign(&[&program_context.payer], program_context.last_blockhash);
    let tx_result = program_context
        .banks_client
        .process_transaction(transaction)
        .await;
    assert!(tx_result.is_err());

    let bank_token_account_data = get_account(&mut program_context, &address_to_create).await;
    let bank_token_account =
        spl_token::state::Account::unpack(&bank_token_account_data.data.as_slice()).unwrap();
    // check that bank token accounts balance the same
    assert_eq!(bank_token_account.amount, tokens_amount);

    let user_token_account_data =
        get_account(&mut program_context, &user_token_account.pubkey()).await;
    let user_token_account =
        spl_token::state::Account::unpack(&user_token_account_data.data.as_slice()).unwrap();

    assert_eq!(user_token_account.amount, 0);
}

#[tokio::test]
async fn test_claim_with_wrong_token_account() {
    let mut program_context = program_test().start_with_context().await;
    let rent = program_context.banks_client.get_rent().await.unwrap();
    let (
        _rng,
        _key,
        priv_key,
        _secp_pubkey,
        mint_account,
        mint_authority,
        user_token_account,
        eth_address
    ) = init_test_variables();

    let message = user_token_account.pubkey().to_bytes();
    let secp256_program_instruction = new_secp256k1_instruction(&priv_key, &message);

    let (base_acc, address_to_create, _) = prepare_claim(
        &mut program_context,
        mint_account,
        rent,
        mint_authority,
        eth_address,
        &user_token_account,
    )
    .await;

    let mut transaction = Transaction::new_with_payer(
        &[
            secp256_program_instruction,
            instruction::transfer (
                &id(),
                &address_to_create,
                // use incorrect user token account
                &Keypair::new().pubkey(),
                &base_acc,
                instruction::Transfer {
                    eth_address,
                    amount: 0,
                },
            )
            .unwrap(),
        ],
        Some(&program_context.payer.pubkey()),
    );

    transaction.sign(&[&program_context.payer], program_context.last_blockhash);
    let tx_result = program_context
        .banks_client
        .process_transaction(transaction)
        .await;

    println!("tx_result: {:?}", tx_result);
    assert!(tx_result.is_err());
    assert_custom_error(
        tx_result,
        1,
        ClaimableProgramError::SignatureVerificationFailed
    );
}


#[tokio::test]
async fn test_missing_secp_instruction() {
    let mut program_context = program_test().start_with_context().await;
    let rent = program_context.banks_client.get_rent().await.unwrap();
    let (
        _rng,
        _key,
        _priv_key,
        _secp_pubkey,
        mint_account,
        mint_authority,
        user_token_account,
        eth_address
    ) = init_test_variables();
    let (base_acc, address_to_create, tokens_amount) = prepare_claim(
        &mut program_context,
        mint_account,
        rent,
        mint_authority,
        eth_address,
        &user_token_account,
    )
    .await;
    let transfer_amount = rand::thread_rng().gen_range(1..tokens_amount);

    // Submit transaction with missing secp256 program instruction
    let mut transaction = Transaction::new_with_payer(
        &[
             instruction::transfer (
                &id(),
                &address_to_create,
                &user_token_account.pubkey(),
                &base_acc,
                instruction::Transfer {
                    eth_address,
                    amount: transfer_amount,
                },
            )
            .unwrap(),
        ],
        Some(&program_context.payer.pubkey()),
    );

    transaction.sign(&[&program_context.payer], program_context.last_blockhash);
    let tx_result = program_context
        .banks_client
        .process_transaction(transaction)
        .await;

    println!("{:?}", tx_result);
    assert!(tx_result.is_err());
    assert_custom_error(
        tx_result,
        0,
        ClaimableProgramError::Secp256InstructionLosing
    );
}