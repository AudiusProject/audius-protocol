const os = require('os')
const fs = require('fs')
const SERVICE_COMMANDS_PATH = `${process.env.PROTOCOL_DIR}/service-commands`

const dotenv = require('dotenv').config({
    path: `${SERVICE_COMMANDS_PATH}/.env.dev`
})

const ETH_PROVIDER_ENDPOINT = process.env.ETH_PROVIDER_ENDPOINT

const DOT_AUDIUS_PATH = `${os.homedir()}/.audius`

let ethContractsConfig
let dataContractsConfig
if (fs.existsSync(`${DOT_AUDIUS_PATH}`)) {
    ethContractsConfig = require(`${DOT_AUDIUS_PATH}/eth-config.json`)
    dataContractsConfig = require(`${DOT_AUDIUS_PATH}/config.json`)
} else {
    ethContractsConfig = {}
    dataContractsConfig = {}
}

const ETH_REGISTRY_ADDRESS = process.env.ETH_REGISTRY_ADDRESS || ethContractsConfig.registryAddress

const ETH_TOKEN_ADDRESS = process.env.ETH_TOKEN_ADDRESS || ethContractsConfig.audiusTokenAddress

const ETH_OWNER_WALLET = process.env.ETH_OWNER_WALLET || ethContractsConfig.ownerWallet

const DATA_CONTRACTS_REGISTRY_ADDRESS = process.env.DATA_CONTRACTS_REGISTRY_ADDRESS || dataContractsConfig.registryAddress

const HEDGEHOG_ENTROPY_KEY = 'hedgehog-entropy-key'

const SEED_CACHE_PATH = `${DOT_AUDIUS_PATH}/seed-cache.json`

const TEMP_TRACK_STORAGE_PATH = `${SERVICE_COMMANDS_PATH}/local-storage/tmp-tracks`

const TEMP_IMAGE_STORAGE_PATH = `${SERVICE_COMMANDS_PATH}/local-storage/tmp-imgs`

const CONTENT_NODE_ALLOWLIST = process.env.CONTENT_NODE_ALLOWLIST
    ? new Set(process.env.CONTENT_NODE_ALLOWLIST.split(','))
    : undefined

const DATA_CONTRACTS_PROVIDER_ENDPOINTS = [process.env.DATA_CONTRACTS_PROVIDER_ENDPOINT]

const USER_METADATA_ENDPOINT = process.env.USER_METADATA_ENDPOINT

const IDENTITY_SERVICE_ENDPOINT = process.env.IDENTITY_SERVICE_ENDPOINT

module.exports = {
    DOT_AUDIUS_PATH,
    HEDGEHOG_ENTROPY_KEY,
    SEED_CACHE_PATH,
    SERVICE_COMMANDS_PATH,
    TEMP_IMAGE_STORAGE_PATH,
    TEMP_TRACK_STORAGE_PATH,
    ETH_REGISTRY_ADDRESS,
    ETH_TOKEN_ADDRESS,
    ETH_OWNER_WALLET,
    DATA_CONTRACTS_REGISTRY_ADDRESS,
    ETH_PROVIDER_ENDPOINT,
    CONTENT_NODE_ALLOWLIST,
    DATA_CONTRACTS_PROVIDER_ENDPOINTS,
    USER_METADATA_ENDPOINT,
    IDENTITY_SERVICE_ENDPOINT
}
