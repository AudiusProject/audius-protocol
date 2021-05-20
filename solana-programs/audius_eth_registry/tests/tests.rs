#![cfg(feature = "test-bpf")]

use audius_eth_registry::*;
use borsh::BorshDeserialize;
use rand::{thread_rng, Rng};
use secp256k1::{PublicKey, SecretKey};
use sha3::Digest;
use solana_program::{hash::Hash, pubkey::Pubkey, system_instruction};
use solana_program_test::*;
use solana_sdk::{
    account::Account,
    secp256k1_instruction,
    signature::{Keypair, Signer},
    transaction::Transaction,
    transport::TransportError,
};

pub fn program_test() -> ProgramTest {
    println!("audius_eth_registry id = {:?}", id());
    ProgramTest::new("audius_eth_registry", id(), processor!(processor::Processor::process))
}

async fn setup() -> (BanksClient, Keypair, Hash, Keypair, Keypair) {
    let (mut banks_client, payer, recent_blockhash) = program_test().start().await;

    let signer_group = Keypair::new();
    let group_owner = Keypair::new();

    create_account(
        &mut banks_client,
        &payer,
        &recent_blockhash,
        &signer_group,
        state::SignerGroup::LEN,
    )
    .await
    .unwrap();

    (
        banks_client,
        payer,
        recent_blockhash,
        signer_group,
        group_owner,
    )
}

async fn create_account(
    banks_client: &mut BanksClient,
    payer: &Keypair,
    recent_blockhash: &Hash,
    account: &Keypair,
    struct_size: usize,
) -> Result<(), TransportError> {
    let rent = banks_client.get_rent().await.unwrap();
    let account_rent = rent.minimum_balance(struct_size);

    let mut transaction = Transaction::new_with_payer(
        &[system_instruction::create_account(
            &payer.pubkey(),
            &account.pubkey(),
            account_rent,
            struct_size as u64,
            &id(),
        )],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[payer, account], *recent_blockhash);
    banks_client.process_transaction(transaction).await?;
    Ok(())
}

async fn get_account(banks_client: &mut BanksClient, pubkey: &Pubkey) -> Account {
    banks_client
        .get_account(*pubkey)
        .await
        .expect("account not found")
        .expect("account empty")
}

async fn process_tx_init_signer_group(
    signer_group: &Pubkey,
    group_owner: &Pubkey,
    payer: &Keypair,
    recent_blockhash: Hash,
    banks_client: &mut BanksClient,
) -> Result<(), TransportError> {
    let mut transaction = Transaction::new_with_payer(
        &[instruction::init_signer_group(
            &id(),
            signer_group,
            group_owner
        ).unwrap()],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[payer], recent_blockhash);
    banks_client.process_transaction(transaction).await?;
    Ok(())
}

async fn process_tx_init_disable_signer_group_owner(
    signer_group: &Pubkey,
    group_owner: &Keypair,
    payer: &Keypair,
    recent_blockhash: Hash,
    banks_client: &mut BanksClient,
) -> Result<(), TransportError> {
    let mut transaction = Transaction::new_with_payer(
        &[instruction::disable_signer_group_owner(
            &id(),
            signer_group,
            &group_owner.pubkey()
        ).unwrap()],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[payer, group_owner], recent_blockhash);
    banks_client.process_transaction(transaction).await?;
    Ok(())
}

async fn process_tx_init_valid_signer(
    valid_signer: &Pubkey,
    signer_group: &Pubkey,
    group_owner: &Keypair,
    payer: &Keypair,
    recent_blockhash: Hash,
    banks_client: &mut BanksClient,
    eth_address: [u8; state::SecpSignatureOffsets::ETH_ADDRESS_SIZE],
) -> Result<(), TransportError> {
    let mut transaction = Transaction::new_with_payer(
        &[instruction::init_valid_signer(
            &id(),
            valid_signer,
            signer_group,
            &group_owner.pubkey(),
            eth_address,
        )
        .unwrap()],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[payer, group_owner], recent_blockhash);
    banks_client.process_transaction(transaction).await?;
    Ok(())
}

fn construct_eth_address(
    pubkey: &PublicKey,
) -> [u8; state::SecpSignatureOffsets::ETH_ADDRESS_SIZE] {
    let mut addr = [0u8; state::SecpSignatureOffsets::ETH_ADDRESS_SIZE];
    addr.copy_from_slice(&sha3::Keccak256::digest(&pubkey.serialize()[1..])[12..]);
    assert_eq!(addr.len(), state::SecpSignatureOffsets::ETH_ADDRESS_SIZE);
    addr
}

#[tokio::test]
#[ignore]
async fn init_signer_group() {
    let (mut banks_client, payer, recent_blockhash, signer_group, group_owner) = setup().await;

    process_tx_init_signer_group(
        &signer_group.pubkey(),
        &group_owner.pubkey(),
        &payer,
        recent_blockhash,
        &mut banks_client,
    )
    .await
    .unwrap();

    let signer_group_account = get_account(&mut banks_client, &signer_group.pubkey()).await;

    assert_eq!(signer_group_account.data.len(), state::SignerGroup::LEN);
    assert_eq!(signer_group_account.owner, id());

    let signer_group_data =
        state::SignerGroup::try_from_slice(&signer_group_account.data.as_slice()).unwrap();

    assert!(signer_group_data.is_initialized());
    assert_eq!(signer_group_data.owner, group_owner.pubkey());
}

#[tokio::test]
async fn disable_signer_group_owner() {
    let (mut banks_client, payer, recent_blockhash, signer_group, group_owner) = setup().await;

    process_tx_init_signer_group(
        &signer_group.pubkey(),
        &group_owner.pubkey(),
        &payer,
        recent_blockhash,
        &mut banks_client,
    )
    .await
    .unwrap();

    let signer_group_account = get_account(&mut banks_client, &signer_group.pubkey()).await;

    assert_eq!(signer_group_account.data.len(), state::SignerGroup::LEN);
    assert_eq!(signer_group_account.owner, id());

    let signer_group_data =
        state::SignerGroup::try_from_slice(&signer_group_account.data.as_slice()).unwrap();

    assert!(signer_group_data.is_initialized());
    assert!(signer_group_data.owner_enabled);
    assert_eq!(signer_group_data.owner, group_owner.pubkey());

    process_tx_init_disable_signer_group_owner(
        &signer_group.pubkey(),
        &group_owner,
        &payer,
        recent_blockhash,
        &mut banks_client,
    )
    .await
    .unwrap();

    // Confirm owner has been disabled
    let disabled_signer_group_account = get_account(&mut banks_client, &signer_group.pubkey()).await;
    let disabled_signer_group_data =
        state::SignerGroup::try_from_slice(&disabled_signer_group_account.data.as_slice()).unwrap();
    assert!(disabled_signer_group_data.is_initialized());
    assert!(!disabled_signer_group_data.owner_enabled);

    // Confirm valid signer CANNOT be added by group owner
    let valid_signer = Keypair::new();

    create_account(
        &mut banks_client,
        &payer,
        &recent_blockhash,
        &valid_signer,
        state::ValidSigner::LEN,
    )
    .await
    .unwrap();

    let eth_address = [1u8; state::SecpSignatureOffsets::ETH_ADDRESS_SIZE];
    let mut transaction = Transaction::new_with_payer(
        &[instruction::init_valid_signer(
            &id(),
            &valid_signer.pubkey(),
            &signer_group.pubkey(),
            &group_owner.pubkey(),
            eth_address,
        )
        .unwrap()],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer, &group_owner], recent_blockhash);
    let transaction_error = banks_client.process_transaction(transaction).await;
    assert!(transaction_error.is_err());
}

#[tokio::test]
#[ignore]
async fn init_valid_signer() {
    let (mut banks_client, payer, recent_blockhash, signer_group, group_owner) = setup().await;

    process_tx_init_signer_group(
        &signer_group.pubkey(),
        &group_owner.pubkey(),
        &payer,
        recent_blockhash,
        &mut banks_client,
    )
    .await
    .unwrap();

    let valid_signer = Keypair::new();

    create_account(
        &mut banks_client,
        &payer,
        &recent_blockhash,
        &valid_signer,
        state::ValidSigner::LEN,
    )
    .await
    .unwrap();

    let eth_address = [1u8; state::SecpSignatureOffsets::ETH_ADDRESS_SIZE];
    process_tx_init_valid_signer(
        &valid_signer.pubkey(),
        &signer_group.pubkey(),
        &group_owner,
        &payer,
        recent_blockhash,
        &mut banks_client,
        eth_address,
    )
    .await
    .unwrap();

    let valid_signer_account = get_account(&mut banks_client, &valid_signer.pubkey()).await;

    assert_eq!(valid_signer_account.data.len(), state::ValidSigner::LEN);
    assert_eq!(valid_signer_account.owner, id());

    let valid_signer_data =
        state::ValidSigner::try_from_slice(&valid_signer_account.data.as_slice()).unwrap();

    assert!(valid_signer_data.is_initialized());
    assert_eq!(valid_signer_data.eth_address, eth_address);
    assert_eq!(valid_signer_data.signer_group, signer_group.pubkey());
}

#[tokio::test]
#[ignore]
async fn clear_valid_signer() {
    let (mut banks_client, payer, recent_blockhash, signer_group, group_owner) = setup().await;

    process_tx_init_signer_group(
        &signer_group.pubkey(),
        &group_owner.pubkey(),
        &payer,
        recent_blockhash,
        &mut banks_client,
    )
    .await
    .unwrap();

    let valid_signer = Keypair::new();

    create_account(
        &mut banks_client,
        &payer,
        &recent_blockhash,
        &valid_signer,
        state::ValidSigner::LEN,
    )
    .await
    .unwrap();

    let eth_address = [1u8; state::SecpSignatureOffsets::ETH_ADDRESS_SIZE];
    process_tx_init_valid_signer(
        &valid_signer.pubkey(),
        &signer_group.pubkey(),
        &group_owner,
        &payer,
        recent_blockhash,
        &mut banks_client,
        eth_address,
    )
    .await
    .unwrap();

    let mut transaction = Transaction::new_with_payer(
        &[instruction::clear_valid_signer(
            &id(),
            &valid_signer.pubkey(),
            &signer_group.pubkey(),
            &group_owner.pubkey(),
        )
        .unwrap()],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer, &group_owner], recent_blockhash);
    banks_client.process_transaction(transaction).await.unwrap();

    let valid_signer_account = get_account(&mut banks_client, &valid_signer.pubkey()).await;

    let valid_signer_data =
        state::ValidSigner::try_from_slice(&valid_signer_account.data.as_slice()).unwrap();

    assert_eq!(valid_signer_data.is_initialized(), false);
}

#[tokio::test]
#[ignore]
async fn validate_signature() {
    let mut rng = thread_rng();
    let key: [u8; 32] = rng.gen();
    let priv_key = SecretKey::parse(&key).unwrap();
    let secp_pubkey = PublicKey::from_secret_key(&priv_key);
    let eth_address = construct_eth_address(&secp_pubkey);

    let message = [8u8; 30];

    let secp256_program_instruction =
        secp256k1_instruction::new_secp256k1_instruction(&priv_key, &message);

    let start = 1;
    let end = start + state::SecpSignatureOffsets::SIGNATURE_OFFSETS_SERIALIZED_SIZE;

    let offsets =
        state::SecpSignatureOffsets::try_from_slice(&secp256_program_instruction.data[start..end])
            .unwrap();

    let sig_start = offsets.signature_offset as usize;
    let sig_end = sig_start + state::SecpSignatureOffsets::SECP_SIGNATURE_SIZE;

    let mut signature: [u8; state::SecpSignatureOffsets::SECP_SIGNATURE_SIZE] =
        [0u8; state::SecpSignatureOffsets::SECP_SIGNATURE_SIZE];
    signature.copy_from_slice(&secp256_program_instruction.data[sig_start..sig_end]);

    let recovery_id = secp256_program_instruction.data[sig_end];

    let signature_data = instruction::SignatureData {
        signature,
        recovery_id,
        message: message.to_vec(),
    };

    let (mut banks_client, payer, recent_blockhash, signer_group, group_owner) = setup().await;

    process_tx_init_signer_group(
        &signer_group.pubkey(),
        &group_owner.pubkey(),
        &payer,
        recent_blockhash,
        &mut banks_client,
    )
    .await
    .unwrap();

    let valid_signer = Keypair::new();

    create_account(
        &mut banks_client,
        &payer,
        &recent_blockhash,
        &valid_signer,
        state::ValidSigner::LEN,
    )
    .await
    .unwrap();

    process_tx_init_valid_signer(
        &valid_signer.pubkey(),
        &signer_group.pubkey(),
        &group_owner,
        &payer,
        recent_blockhash,
        &mut banks_client,
        eth_address,
    )
    .await
    .unwrap();

    let mut transaction = Transaction::new_with_payer(
        &[
            secp256_program_instruction,
            instruction::validate_signature(
                &id(),
                &valid_signer.pubkey(),
                &signer_group.pubkey(),
                signature_data,
            )
            .unwrap(),
        ],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer], recent_blockhash);
    banks_client.process_transaction(transaction).await.unwrap();
}

#[tokio::test]
#[ignore]
async fn validate_signature_with_wrong_data() {
    let mut rng = thread_rng();
    let key: [u8; 32] = rng.gen();
    let priv_key = SecretKey::parse(&key).unwrap();
    let secp_pubkey = PublicKey::from_secret_key(&priv_key);
    let eth_address = construct_eth_address(&secp_pubkey);

    let message = [1u8; 29];

    let secp256_program_instruction =
        secp256k1_instruction::new_secp256k1_instruction(&priv_key, &message);

    let start = 1;
    let end = start + state::SecpSignatureOffsets::SIGNATURE_OFFSETS_SERIALIZED_SIZE;

    let offsets =
        state::SecpSignatureOffsets::try_from_slice(&secp256_program_instruction.data[start..end])
            .unwrap();

    let sig_start = offsets.signature_offset as usize;
    let sig_end = sig_start + state::SecpSignatureOffsets::SECP_SIGNATURE_SIZE;

    let signature: [u8; state::SecpSignatureOffsets::SECP_SIGNATURE_SIZE] =
        [8u8; state::SecpSignatureOffsets::SECP_SIGNATURE_SIZE];

    let recovery_id = secp256_program_instruction.data[sig_end];

    let signature_data = instruction::SignatureData {
        signature,
        recovery_id,
        message: message.to_vec(),
    };

    let (mut banks_client, payer, recent_blockhash, signer_group, group_owner) = setup().await;

    process_tx_init_signer_group(
        &signer_group.pubkey(),
        &group_owner.pubkey(),
        &payer,
        recent_blockhash,
        &mut banks_client,
    )
    .await
    .unwrap();

    let valid_signer = Keypair::new();

    create_account(
        &mut banks_client,
        &payer,
        &recent_blockhash,
        &valid_signer,
        state::ValidSigner::LEN,
    )
    .await
    .unwrap();

    process_tx_init_valid_signer(
        &valid_signer.pubkey(),
        &signer_group.pubkey(),
        &group_owner,
        &payer,
        recent_blockhash,
        &mut banks_client,
        eth_address,
    )
    .await
    .unwrap();

    let mut transaction = Transaction::new_with_payer(
        &[
            secp256_program_instruction,
            instruction::validate_signature(
                &id(),
                &valid_signer.pubkey(),
                &signer_group.pubkey(),
                signature_data,
            )
            .unwrap(),
        ],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer], recent_blockhash);
    let transaction_error = banks_client.process_transaction(transaction).await;

    assert!(transaction_error.is_err());
}
