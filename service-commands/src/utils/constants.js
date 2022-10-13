const os = require('os')
const fs = require('fs')
const SERVICE_COMMANDS_PATH = `${process.env.PROTOCOL_DIR}/service-commands`

require('dotenv').config({
    path: `${SERVICE_COMMANDS_PATH}/.env.dev`
})


const DOT_AUDIUS_PATH = `${os.homedir()}/.audius`

let ethContractsConfig
let dataContractsConfig
if (fs.existsSync(DOT_AUDIUS_PATH)) {
    ethContractsConfig = require(`${DOT_AUDIUS_PATH}/eth-config.json`)
    dataContractsConfig = require(`${DOT_AUDIUS_PATH}/config.json`)
    solanaConfig = require(`${DOT_AUDIUS_PATH}/solana-program-config.json`)
} else {
    ethContractsConfig = {
        audiusTokenAddress: "0xdcB2fC9469808630DD0744b0adf97C0003fC29B2",
        registryAddress: "0xABbfF712977dB51f9f212B85e8A4904c818C2b63",
        ownerWallet: "0x855FA758c77D68a04990E992aA4dcdeF899F654A",
    }
    dataContractsConfig = {
        registryAddress: "0xCfEB869F69431e42cdB54A4F4f105C19C080A601",
    }
    solanaConfig = {
        endpoint: "http://127.0.0.1:8899",
        splToken: "37RCjhgV1qGV2Q54EHFScdxZ22ydRMdKMtVgod47fDP3",
        claimableTokenAddress: "testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9",
        rewardsManagerAddress: "testLsJKtyABc9UXJF8JWFKf1YH4LmqCWBC42c6akPb",
        rewardsManagerAccount: "DJPzVothq58SmkpRb1ATn5ddN2Rpv1j2TcGvM3XsHf1c",
        rewardsManagerTokenAccount: "FRk4j95RG2kSk3BHXBPVgKszFc2rLQ8K6RS83k3dmzvQ",
        feePayerWallets: [
            {
                privateKey: [170, 161, 84, 122, 118, 210, 128, 213, 96, 185, 143, 218, 54, 254, 217, 204, 157, 175, 137, 71, 202, 108, 51, 242, 21, 50, 56, 77, 54, 116, 103, 56, 251, 64, 77, 100, 199, 88, 103, 189, 42, 163, 67, 251, 101, 204, 7, 59, 70, 109, 113, 50, 209, 154, 55, 164, 227, 108, 203, 146, 121, 148, 85, 119]
            }
        ],
    }
}

const config = {
    DOT_AUDIUS_PATH,
    SERVICE_COMMANDS_PATH,
    ETH_PROVIDER_ENDPOINT: process.env.ETH_PROVIDER_ENDPOINT,
    ETH_REGISTRY_ADDRESS: process.env.ETH_REGISTRY_ADDRESS || ethContractsConfig.registryAddress,
    ETH_TOKEN_ADDRESS: process.env.ETH_TOKEN_ADDRESS || ethContractsConfig.audiusTokenAddress,
    ETH_OWNER_WALLET: process.env.ETH_OWNER_WALLET || ethContractsConfig.ownerWallet,
    DATA_CONTRACTS_REGISTRY_ADDRESS: process.env.DATA_CONTRACTS_REGISTRY_ADDRESS || dataContractsConfig.registryAddress,
    HEDGEHOG_ENTROPY_KEY: 'hedgehog-entropy-key',
    SEED_CACHE_PATH: `${DOT_AUDIUS_PATH}/seed-cache.json`,
    TEMP_TRACK_STORAGE_PATH: `${SERVICE_COMMANDS_PATH}/local-storage/tmp-tracks`,
    TEMP_IMAGE_STORAGE_PATH: `${SERVICE_COMMANDS_PATH}/local-storage/tmp-imgs`,
    CONTENT_NODE_ALLOWLIST: process.env.CONTENT_NODE_ALLOWLIST
        ? new Set(process.env.CONTENT_NODE_ALLOWLIST.split(','))
        : undefined,
    DATA_CONTRACTS_PROVIDER_ENDPOINTS: [process.env.DATA_CONTRACTS_PROVIDER_ENDPOINT],
    USER_METADATA_ENDPOINT: process.env.USER_METADATA_ENDPOINT,
    IDENTITY_SERVICE_ENDPOINT: process.env.IDENTITY_SERVICE_ENDPOINT,
    SOLANA_ENDPOINT: solanaConfig.endpoint,
    SOLANA_MINT_ADDRESS: solanaConfig.splToken,
    SOLANA_TOKEN_ADDRESS: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    SOLANA_CLAIMABLE_TOKEN_PROGRAM_ADDRESS: solanaConfig.claimableTokenAddress,
    SOLANA_REWARDS_MANAGER_PROGRAM_ID: solanaConfig.rewardsManagerAddress,
    SOLANA_REWARDS_MANAGER_PROGRAM_PDA: solanaConfig.rewardsManagerAccount,
    SOLANA_REWARDS_MANAGER_TOKEN_PDA: solanaConfig.rewardsManagerTokenAccount,
    SOLANA_FEE_PAYER_SECRET_KEYS: solanaConfig.feePayerWallets ? solanaConfig.feePayerWallets.map(wallet => Uint8Array.from(wallet.privateKey)) : undefined
}

module.exports = config
