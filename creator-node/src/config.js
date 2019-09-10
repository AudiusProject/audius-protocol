const axios = require('axios')
const convict = require('convict')
const fs = require('fs')

// Define a schema
const config = convict({
  dbUrl: {
    doc: 'Database URL connection string',
    format: String,
    env: 'dbUrl',
    default: null
  },
  ipfsHost: {
    doc: 'IPFS host address',
    format: String,
    env: 'ipfsHost',
    default: null
  },
  ipfsPort: {
    doc: 'IPFS port',
    format: 'port',
    env: 'ipfsPort',
    default: null
  },
  storagePath: {
    doc: 'File system path to store raw files that are uploaded',
    format: String,
    env: 'storagePath',
    default: null
  },
  redisHost: {
    doc: 'Redis host name',
    format: String,
    env: 'redisHost',
    default: null
  },
  allowedUploadFileExtensions: {
    doc: 'Override the default list of file extension allowed',
    format: Array,
    env: 'allowedUploadFileExtensions',
    default: [
      'mp2', 'mp3', 'mpga',
      'mp4', 'm4a', 'm4p', 'm4b', 'm4r', 'm4v',
      'wav', 'wave',
      'flac',
      'aif', 'aiff', 'aifc',
      'ogg', 'ogv', 'oga', 'ogx', 'ogm', 'spx', 'opus',
      '3gp', 'aac',
      'amr', '3ga',
      'awb',
      'xwma',
      'webm',
      'ts', 'tsv', 'tsa'
    ]
  },
  redisPort: {
    doc: 'Redis port',
    format: 'port',
    env: 'redisPort',
    default: null
  },
  port: {
    doc: 'Port to run service on',
    format: 'port',
    env: 'port',
    default: null
  },
  logLevel: {
    doc: 'Log level',
    format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
    env: 'logLevel',
    default: null
  },
  rateLimitingAudiusUserReqLimit: {
    doc: 'Total requests per hour rate limit for /audius_user routes',
    format: 'nat',
    env: 'rateLimitingAudiusUserReqLimit',
    default: null
  },
  rateLimitingUserReqLimit: {
    doc: 'Total requests per hour rate limit for /users routes',
    format: 'nat',
    env: 'rateLimitingUserReqLimit',
    default: null
  },
  rateLimitingMetadataReqLimit: {
    doc: 'Total requests per hour rate limit for /metadata routes',
    format: 'nat',
    env: 'rateLimitingMetadataReqLimit',
    default: null
  },
  rateLimitingImageReqLimit: {
    doc: 'Total requests per hour rate limit for /image_upload routes',
    format: 'nat',
    env: 'rateLimitingImageReqLimit',
    default: null
  },
  rateLimitingTrackReqLimit: {
    doc: 'Total requests per hour rate limit for /track routes',
    format: 'nat',
    env: 'rateLimitingTrackReqLimit',
    default: null
  },
  maxAudioFileSizeBytes: {
    doc: 'Maximum file size for audio file uploads in bytes',
    format: 'nat',
    env: 'maxAudioFileSizeBytes',
    default: null
  },
  maxMemoryFileSizeBytes: {
    doc: 'Maximum memory usage for audio file uploads in bytes',
    format: 'nat',
    env: 'maxMemoryFileSizeBytes',
    default: null
  },
  serviceLatitude: {
    doc: 'Latitude where the server running this service is located',
    format: String,
    env: 'serviceLatitude',
    default: null
  },
  serviceLongitude: {
    doc: 'Longitude where the server running this service is located',
    format: String,
    env: 'serviceLongitude',
    default: null
  },
  serviceCountry: {
    doc: 'Country where the server running this service is located',
    format: String,
    env: 'serviceCountry',
    default: null
  },
  sampleRate: {
    doc: 'FFMPEG sample rate',
    format: 'nat',
    env: 'sampleRate',
    default: 48000
  },
  bitRate: {
    doc: 'FFMPEG bit rate',
    format: String,
    env: 'bitRate',
    default: '320k'
  },
  hlsTime: {
    doc: 'Time of each HLS segment',
    format: 'nat',
    env: 'hlsTime',
    default: 6
  },
  hlsSegmentType: {
    doc: 'Time of each HLS segment',
    format: String,
    env: 'hlsSegmentType',
    default: 'mpegts'
  },

  // wallet information
  delegateOwnerWallet: {
    doc: 'wallet address',
    format: String,
    env: 'delegateOwnerWallet',
    default: null
  },
  delegatePrivateKey: {
    doc: 'private key string',
    format: String,
    env: 'delegatePrivateKey',
    default: null
  },

  ethProviderUrl: {
    doc: 'eth provider url',
    format: String,
    env: 'ethProviderUrl',
    default: null
  },
  ethNetworkId: {
    doc: 'eth network id',
    format: String,
    env: 'ethNetworkId',
    default: null
  },
  ethTokenAddress: {
    doc: 'eth token address',
    format: String,
    env: 'ethTokenAddress',
    default: null
  },
  ethRegistryAddress: {
    doc: 'eth registry address',
    format: String,
    env: 'ethRegistryAddress',
    default: null
  },
  ethOwnerWallet: {
    doc: 'eth owner wallet',
    format: String,
    env: 'ethOwnerWallet',
    default: null
  },
  spOwnerWallet: {
    doc: 'Service provider owner wallet',
    format: String,
    env: 'spOwnerWallet',
    default: null
  },
  ethWallets: {
    doc: 'all unlocked accounts from eth chain',
    format: Array,
    env: 'ethWallets',
    default: null
  },
  spOwnerWalletIndex: {
    doc: 'Index in ethWallets array of service owner wallet',
    format: Number,
    env: 'spOwnerWalletIndex',
    default: null
  }

  // unsupported options at the moment
  // awsBucket: {
  //   doc: 'AWS S3 bucket to upload files to',
  //   format: String,
  //   env: 'awsBucket',
  //   default: null
  // },
  // awsAccessKeyId: {
  //   doc: 'AWS access key id',
  //   format: String,
  //   env: 'awsAccessKeyId',
  //   default: null
  // },
  // awsSecretAccessKey: {
  //   doc: 'AWS access key secret',
  //   format: String,
  //   env: 'awsSecretAccessKey',
  //   default: null
  // }
})

/*
 * If you wanted to load a file, this is lower precendence than env variables.
 * So if registryAddress or ownerWallet env variables are defined, they take precendence.
 */

// TODO(DM) - remove these defaults
const defaultConfigExists = fs.existsSync('default-config.json')
if (defaultConfigExists) config.loadFile('default-config.json')

if (fs.existsSync('eth-contract-config.json')) {
  let ethContractConfig = require('../eth-contract-config.json')
  config.load({
    'ethTokenAddress': ethContractConfig.audiusTokenAddress,
    'ethRegistryAddress': ethContractConfig.registryAddress,
    'ethOwnerWallet': ethContractConfig.ownerWallet,
    'ethWallets': ethContractConfig.allWallets
  })
}

// Perform validation and error any properties are not present on schema
config.validate()

const asyncConfig = async () => {
  const ipinfo = await axios.get('https://ipinfo.io')
  const country = ipinfo.data.country
  const [lat, long] = ipinfo.data.loc.split(',')

  if (!config.get('serviceCountry')) config.set('serviceCountry', country)
  if (!config.get('serviceLatitude')) config.set('serviceLatitude', lat)
  if (!config.get('serviceLongitude')) config.set('serviceLongitude', long)
}

config.asyncConfig = asyncConfig

module.exports = config
