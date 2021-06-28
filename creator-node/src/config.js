const axios = require('axios')
const convict = require('convict')
const fs = require('fs')

// Custom boolean format used to ensure that empty string '' is evaluated as false
// https://github.com/mozilla/node-convict/issues/380
convict.addFormat({
  name: 'BooleanCustom',
  validate: function (val) {
    return (typeof val === 'boolean') || (typeof val === 'string')
  },
  coerce: function (val) {
    return val === true || val === 'true'
  }
})

// Define a schema
const config = convict({
  dbUrl: {
    doc: 'Database URL connection string',
    format: String,
    env: 'dbUrl',
    default: null
  },
  dbConnectionPoolMax: {
    doc: 'Max connections in database pool',
    format: 'nat',
    env: 'dbConnectionPoolMax',
    default: 100
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
  setTimeout: {
    doc: `
      Sets the timeout value (in ms) for sockets
      https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_server_settimeout_msecs_callback
    `,
    format: 'nat',
    env: 'timeout',
    default: 60 * 60 * 1000 // 1 hour
  },
  timeout: {
    doc: `
      Sets the timeout value (in ms) for socket inactivity
      https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_server_timeout
    `,
    format: 'nat',
    env: 'timeout',
    default: 60 * 60 * 1000 // 1 hour
  },
  keepAliveTimeout: {
    doc: `
      Server keep alive timeout
      https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_server_keepalivetimeout
    `,
    format: 'nat',
    env: 'keepAliveTimeout',
    default: 5000 // node.js default value
  },
  headersTimeout: {
    doc: `
      Server headers timeout
      https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_server_headerstimeout
    `,
    format: 'nat',
    env: 'headersTimeout',
    default: 60 * 1000 // 60s - node.js default value
  },
  logLevel: {
    doc: 'Log level',
    format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
    env: 'logLevel',
    default: null
  },

  maxExportClockValueRange: {
    doc: 'Maximum range of clock values to export at once to prevent process OOM',
    format: Number,
    env: 'maxExportClockValueRange',
    default: 10000
  },

  // Rate limit configs
  endpointRateLimits: {
    doc: `A serialized objects of rate limits with the form {
      <req.path>: {
        <req.method>:
          [
            {
              expiry: <seconds>,
              max: <count>
            },
            ...
          ],
          ...
        }
      }
    `,
    format: String,
    env: 'endpointRateLimits',
    default: '{}'
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
  rateLimitingBatchCidsExistLimit: {
    doc: 'Total requests per hour rate limit for /track routes',
    format: 'nat',
    env: 'rateLimitingBatchCidsExistLimit',
    default: null
  },
  URSMRequestForSignatureReqLimit: {
    doc: 'Total requests per hour rate limit for /ursm_request_for_signature route',
    format: 'nat',
    env: 'URSMRequestForSignatureReqLimit',
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
    doc: 'Segment type of each HLS segment',
    format: String,
    env: 'hlsSegmentType',
    default: 'mpegts'
  },
  printSequelizeLogs: {
    doc: 'If we should print logs from sequelize',
    format: Boolean,
    env: 'printSequelizeLogs',
    default: true
  },

  // Transcoding settings
  transcodingMaxConcurrency: {
    doc: 'Maximum ffmpeg processes to spawn concurrently. If unset (-1), set to # of CPU cores available',
    format: Number,
    env: 'transcodingMaxConcurrency',
    default: -1
  },

  // Image processing settings
  imageProcessingMaxConcurrency: {
    doc: 'Maximum image resizing processes to spawn concurrently. If unset (-1), set to # of CPU cores available',
    format: Number,
    env: 'imageProcessingMaxConcurrency',
    default: -1
  },

  // Sync configs
  nodeSyncFileSaveMaxConcurrency: {
    doc: 'Max concurrency of saveFileForMultihashToFS calls inside nodesync',
    format: 'nat',
    env: 'nodeSyncFileSaveMaxConcurrency',
    default: 10
  },
  syncQueueMaxConcurrency: {
    doc: 'Max concurrency of SyncQueue',
    format: 'nat',
    env: 'syncQueueMaxConcurrency',
    default: 50
  },
  issueAndWaitForSecondarySyncRequestsPollingDurationMs: {
    doc: 'Duration for which to poll secondaries for content replication in `issueAndWaitForSecondarySyncRequests` function',
    format: 'nat',
    env: 'issueAndWaitForSecondarySyncRequestsPollingDurationMs',
    default: 5000 // 5000ms = 5s (prod default)
  },
  enforceWriteQuorum: {
    doc: 'Boolean flag indicating whether or not primary should reject write on 2/3 replication across replica set',
    format: Boolean,
    env: 'enforceWriteQuorum',
    default: false
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
  // `env` property is not defined as this should never be passed in as an envvar and should only be set programatically
  isRegisteredOnURSM: {
    doc: 'boolean indicating whether or not node has been registered on dataContracts UserReplicaSetManager contract (URSM)',
    format: Boolean,
    default: false
  },

  spID: {
    doc: 'ID of creator node in ethContracts ServiceProviderFactory',
    format: Number,
    env: 'spID',
    default: 0
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
    default: []
  },
  spOwnerWalletIndex: {
    doc: 'Index in ethWallets array of service owner wallet',
    format: Number,
    env: 'spOwnerWalletIndex',
    default: 0
  },
  isUserMetadataNode: {
    doc: 'Flag indicating whether to run this node for user metadata (non creators) only',
    format: Boolean,
    env: 'isUserMetadataNode',
    default: false
  },
  isReadOnlyMode: {
    doc: 'Flag indicating whether to run this node in read only mode (no writes)',
    format: Boolean,
    env: 'isReadOnlyMode',
    default: false
  },
  userMetadataNodeUrl: {
    doc: 'address for user metadata node',
    format: String,
    env: 'userMetadataNodeUrl',
    default: ''
  },
  debounceTime: {
    doc: 'sync debounce time in ms',
    format: 'nat',
    env: 'debounceTime',
    default: 0 // 0ms
  },
  dataRegistryAddress: {
    doc: 'data contracts registry address',
    format: String,
    env: 'dataRegistryAddress',
    default: null
  },
  dataProviderUrl: {
    doc: 'data contracts web3 provider url',
    format: String,
    env: 'dataProviderUrl',
    default: null
  },
  dataNetworkId: {
    doc: 'data contracts network id',
    format: String,
    env: 'dataNetworkId',
    default: null
  },
  creatorNodeEndpoint: {
    doc: 'http endpoint registered on chain for cnode',
    format: String,
    env: 'creatorNodeEndpoint',
    default: null
  },

  // Service selection
  discoveryProviderWhitelist: {
    doc: 'Whitelisted discovery providers to select from (comma-separated)',
    format: String,
    env: 'discoveryProviderWhitelist',
    default: ''
  },
  identityService: {
    doc: 'Identity service endpoint to record creator-node driven plays against',
    format: String,
    env: 'identityService',
    default: ''
  },
  creatorNodeIsDebug: {
    doc: 'Whether the creatornode is in debug mode.',
    format: Boolean,
    env: 'creatorNodeIsDebug',
    default: false
  },
  rehydrateMaxConcurrency: {
    doc: 'Number of concurrent rehydrate queue tasks running',
    format: 'nat',
    env: 'rehydrateMaxConcurrency',
    default: 10
  },
  snapbackDevModeEnabled: {
    doc: 'TEST ONLY. DO NOT CONFIGURE MANUALLY. Disables automatic secondary sync issuing in order to test SnapbackSM.',
    format: 'BooleanCustom',
    env: 'snapbackDevModeEnabled',
    default: false
  },
  snapbackReconfigEnabled: {
    doc: 'Enables replica set reconfiguration or not. Currently enabled for dev mode, disabled for prod.',
    format: 'BooleanCustom',
    env: 'snapbackReconfigEnabled',
    default: false
  },
  snapbackModuloBase: {
    doc: 'The modulo base to segment users by on snapback. Will process `1/snapbackModuloBase` users at some snapback interval',
    format: 'nat',
    env: 'snapbackModuloBase',
    default: 24
  },
  snapbackJobInterval: {
    doc: 'Interval [ms] that snapbackSM jobs are fired; 1 hour',
    format: 'nat',
    env: 'snapbackJobInterval',
    default: 3600000
  },
  devMode: {
    doc: 'Used to differentiate production vs dev mode for node',
    format: 'BooleanCustom',
    env: 'devMode',
    default: false
  },
  maxStorageUsedPercent: {
    doc: 'Max percentage of storage capacity allowed to be used in CNode before blocking writes',
    format: 'nat',
    env: 'maxStorageUsedPercent',
    default: 95
  },
  pinAddCIDs: {
    doc: 'Array of comma separated CIDs to pin',
    format: String,
    env: 'pinAddCIDs',
    default: ''
  },
  cidWhitelist: {
    doc: 'Array of comma separated CIDs to whitelist. Takes precedent over blacklist',
    format: String,
    env: 'cidWhitelist',
    default: ''
  },
  enableRehydrate: {
    doc: 'Flag to enable or disable rehydrate',
    format: Boolean,
    env: 'enableRehydrate',
    default: true
  },
  maxManualRequestSyncJobConcurrency: {
    doc: 'Max bull queue concurrency for manual sync request jobs',
    format: 'nat',
    env: 'maxManualRequestSyncJobConcurrency',
    default: 15
  },
  maxRecurringRequestSyncJobConcurrency: {
    doc: 'Max bull queue concurrency for recurring sync request jobs',
    format: 'nat',
    env: 'maxRecurringRequestSyncJobConcurrency',
    default: 5
  },

  // peerSetManager configs
  peerHealthCheckRequestTimeout: {
    doc: 'Timeout [ms] for checking health check route',
    format: 'nat',
    env: 'peerHealthCheckRequestTimeout',
    default: 2000
  },
  minimumStoragePathSize: {
    doc: 'Minimum storage size [bytes] on node to be a viable option in peer set; 100gb',
    format: 'nat',
    env: 'minimumStoragePathSize',
    default: 100000000000
  },
  minimumMemoryAvailable: {
    doc: 'Minimum memory available [bytes] on node to be a viable option in peer set; 2gb',
    format: 'nat',
    env: 'minimumMemoryAvailable',
    default: 2000000000
  },
  maxFileDescriptorsAllocatedPercentage: {
    doc: 'Max file descriptors allocated percentage on node to be a viable option in peer set',
    format: 'nat',
    env: 'maxFileDescriptorsAllocatedPercentage',
    default: 95
  },
  minimumDailySyncCount: {
    doc: 'Minimum count of daily syncs that need to have occurred to consider daily sync history',
    format: 'nat',
    env: 'minimumDailySyncCount',
    default: 50
  },
  minimumRollingSyncCount: {
    doc: 'Minimum count of rolling syncs that need to have occurred to consider rolling sync history',
    format: 'nat',
    env: 'minimumRollingSyncCount',
    default: 5000
  },
  minimumSuccessfulSyncCountPercentage: {
    doc: 'Minimum percentage of failed syncs to be considered unhealthy',
    format: 'nat',
    env: 'minimumSuccessfulSyncCountPercentage',
    // TODO: Update to higher percentage when higher threshold of syncs are passing
    default: 0
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

if (fs.existsSync('contract-config.json')) {
  const dataContractConfig = require('../contract-config.json')
  config.load({
    'dataRegistryAddress': dataContractConfig.registryAddress
  })
}

// Perform validation and error any properties are not present on schema
config.validate()

// Retrieves and populates IP info configs
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
