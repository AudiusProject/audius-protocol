#![cfg(feature = "test-bpf")]

use borsh::BorshDeserialize;
use borsh::BorshSerialize;
use rand::{thread_rng, Rng};
use secp256k1::{PublicKey, SecretKey};
use sha3::Digest;
use solana_program::{hash::Hash, pubkey::Pubkey, system_instruction};
use track_listen_count::*;
use solana_program_test::*;
use solana_sdk::{
    secp256k1_instruction,
    signature::{Keypair, Signer},
    transaction::Transaction,
    transport::TransportError,
};
use chrono::Utc;

pub fn program_test() -> ProgramTest {
    ProgramTest::new(
        "track_listen_count",
        id(),
        processor!(processor::Processor::process_instruction),
    )
}

async fn setup() -> (BanksClient, Keypair, Hash, Keypair, Keypair) {
    let mut test_solana_env = program_test();
    test_solana_env.add_program(
        "audius",
        audius::id(),
        processor!(audius::processor::Processor::process),
    );

    let (mut banks_client, payer, recent_blockhash) = test_solana_env.start().await;

    let signer_group = Keypair::new();
    let group_owner = Keypair::new();

    create_account(
        &mut banks_client,
        &payer,
        &recent_blockhash,
        &signer_group,
        audius::state::SignerGroup::LEN,
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
            &audius::id(),
        )],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[payer, account], *recent_blockhash);
    banks_client.process_transaction(transaction).await?;
    Ok(())
}

async fn process_tx_init_signer_group(
    signer_group: &Pubkey,
    group_owner: &Pubkey,
    payer: &Keypair,
    recent_blockhash: &Hash,
    banks_client: &mut BanksClient,
) -> Result<(), TransportError> {
    let mut transaction = Transaction::new_with_payer(
        &[
            audius::instruction::init_signer_group(&audius::id(), signer_group, group_owner)
                .unwrap(),
        ],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[payer], *recent_blockhash);
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
    eth_address: [u8; audius::state::SecpSignatureOffsets::ETH_ADDRESS_SIZE],
) -> Result<(), TransportError> {
    let mut transaction = Transaction::new_with_payer(
        &[audius::instruction::init_valid_signer(
            &audius::id(),
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
) -> [u8; audius::state::SecpSignatureOffsets::ETH_ADDRESS_SIZE] {
    let mut addr = [0u8; audius::state::SecpSignatureOffsets::ETH_ADDRESS_SIZE];
    addr.copy_from_slice(&sha3::Keccak256::digest(&pubkey.serialize()[1..])[12..]);
    assert_eq!(
        addr.len(),
        audius::state::SecpSignatureOffsets::ETH_ADDRESS_SIZE
    );
    addr
}

#[tokio::test]
async fn test_call_example_instruction() {
    let mut rng = thread_rng();
    let key: [u8; 32] = rng.gen();
    let priv_key = SecretKey::parse(&key).unwrap();
    let secp_pubkey = PublicKey::from_secret_key(&priv_key);
    let eth_address = construct_eth_address(&secp_pubkey);

    let track_data = state::TrackData {
        user_id: String::from("U348512"),
        track_id: String::from("T52354"),
        source: String::from("some/path/to/source"),
        timestamp: Utc::now().timestamp(),
    };

    let message = track_data.try_to_vec().unwrap();

    let secp256_program_instruction =
        secp256k1_instruction::new_secp256k1_instruction(&priv_key, message.as_ref());

    let start = 1;
    let end = start + audius::state::SecpSignatureOffsets::SIGNATURE_OFFSETS_SERIALIZED_SIZE;

    let offsets = audius::state::SecpSignatureOffsets::try_from_slice(
        &secp256_program_instruction.data[start..end],
    )
    .unwrap();

    let sig_start = offsets.signature_offset as usize;
    let sig_end = sig_start + audius::state::SecpSignatureOffsets::SECP_SIGNATURE_SIZE;

    let mut signature: [u8; audius::state::SecpSignatureOffsets::SECP_SIGNATURE_SIZE] =
        [0u8; audius::state::SecpSignatureOffsets::SECP_SIGNATURE_SIZE];
    signature.copy_from_slice(&secp256_program_instruction.data[sig_start..sig_end]);

    let recovery_id = secp256_program_instruction.data[sig_end];

    let (mut banks_client, payer, recent_blockhash, signer_group, group_owner) = setup().await;

    process_tx_init_signer_group(
        &signer_group.pubkey(),
        &group_owner.pubkey(),
        &payer,
        &recent_blockhash,
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
        audius::state::ValidSigner::LEN,
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

    let instruction_args = instruction::InstructionArgs {
        track_data,
        signature,
        recovery_id,
    };

    let mut transaction = Transaction::new_with_payer(
        &[
            secp256_program_instruction,
            instruction::init(
                &id(),
                &valid_signer.pubkey(),
                &signer_group.pubkey(),
                instruction_args,
            )
            .unwrap(),
        ],
        Some(&payer.pubkey()),
    );

    transaction.sign(&[&payer], recent_blockhash);
    banks_client.process_transaction(transaction).await.unwrap();
}
