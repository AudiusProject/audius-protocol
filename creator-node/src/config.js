const axios = require('axios')
const convict = require('convict')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const _ = require('lodash')

// can't import logger here due to possible circular dependency, use console

// Custom boolean format used to ensure that empty string '' is evaluated as false
// https://github.com/mozilla/node-convict/issues/380
convict.addFormat({
  name: 'BooleanCustom',
  validate: function (val) {
    return typeof val === 'boolean' || typeof val === 'string'
  },
  coerce: function (val) {
    return val === true || val === 'true'
  }
})

// Define a schema
const config = convict({
  // Required node-specific overrides
  creatorNodeEndpoint: {
    doc: 'http endpoint registered on chain for cnode',
    format: String,
    env: 'creatorNodeEndpoint',
    default: null
  },

  // Infra
  dbUrl: {
    doc: 'Database URL connection string',
    format: String,
    env: 'dbUrl',
    default: 'postgres://postgres:postgres@localhost:4432/audius_creator_node'
  },
  dbConnectionPoolMax: {
    doc: 'Max connections in database pool',
    format: 'nat',
    env: 'dbConnectionPoolMax',
    default: 100
  },
  redisHost: {
    doc: 'Redis host name',
    format: String,
    env: 'redisHost',
    default: 'localhost'
  },
  redisPort: {
    doc: 'Redis port',
    format: 'port',
    env: 'redisPort',
    default: 4379
  },
  audiusContentInfraSetup: {
    doc: 'How the content node infrastructure stack is running, injected by the infra directly, not to be defined manually',
    format: String,
    env: 'audiusContentInfraSetup',
    default: ''
  },

  // Node.js
  setTimeout: {
    doc: `
      Sets the timeout value (in ms) for sockets
      https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_server_settimeout_msecs_callback
    `,
    format: 'nat',
    env: 'setTimeout',
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

  // Chain
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
  solDelegatePrivateKeyBase64: {
    doc: 'Base64-encoded Solana private key created using delegatePrivateKey as the seed (auto-generated -- any input here will be overwritten)',
    format: String,
    env: 'solDelegatePrivateKeyBase64',
    default: ''
  },
  ethProviderUrl: {
    doc: 'eth provider url',
    format: String,
    env: 'ethProviderUrl',
    default: ''
  },
  ethNetworkId: {
    doc: 'eth network id',
    format: String,
    env: 'ethNetworkId',
    default: ''
  },
  ethTokenAddress: {
    doc: 'eth token address',
    format: String,
    env: 'ethTokenAddress',
    default: ''
  },
  ethRegistryAddress: {
    doc: 'eth registry address',
    format: String,
    env: 'ethRegistryAddress',
    default: ''
  },
  ethOwnerWallet: {
    doc: 'eth owner wallet',
    format: String,
    env: 'ethOwnerWallet',
    default: ''
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
  dataRegistryAddress: {
    doc: 'data contracts registry address',
    format: String,
    env: 'dataRegistryAddress',
    default: ''
  },
  entityManagerAddress: {
    doc: 'entity manager registry address',
    format: String,
    env: 'entityManagerAddress',
    default: '0x2F99338637F027CFB7494E46B49987457beCC6E3'
  },
  dataProviderUrl: {
    doc: 'data contracts web3 provider url',
    format: String,
    env: 'dataProviderUrl',
    default: ''
  },
  dataNetworkId: {
    doc: 'data contracts network id',
    format: String,
    env: 'dataNetworkId',
    default: ''
  },

  // Application
  port: {
    doc: 'Port to run service on',
    format: 'port',
    env: 'port',
    default: 4000
  },
  sequelizeStatementTimeout: {
    doc: 'Sequelize (postgres) statement timeout',
    format: 'nat',
    env: 'sequelizeStatementTimeout',
    default: 60 * 60 * 1000 // 1hr
  },
  logLevel: {
    doc: 'Log level',
    format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
    env: 'logLevel',
    default: 'info'
  },
  serviceLatitude: {
    doc: 'Latitude where the server running this service is located',
    format: String,
    env: 'serviceLatitude',
    default: ''
  },
  serviceLongitude: {
    doc: 'Longitude where the server running this service is located',
    format: String,
    env: 'serviceLongitude',
    default: ''
  },
  serviceCountry: {
    doc: 'Country where the server running this service is located',
    format: String,
    env: 'serviceCountry',
    default: ''
  },
  printSequelizeLogs: {
    doc: 'If we should print logs from sequelize',
    format: Boolean,
    env: 'printSequelizeLogs',
    default: false
  },
  expressAppConcurrency: {
    doc: 'Number of processes to spawn, where each process runs its own Content Node. Default 0 to run one process per core (auto-detected). Note that clusterModeEnabled must also be true for this to take effect',
    format: 'nat',
    env: 'expressAppConcurrency',
    default: 0
  },
  clusterModeEnabled: {
    doc: 'Whether or not cluster logic should be enabled (running multiple instances of the app to better utuilize multiple logical cores)',
    format: Boolean,
    env: 'clusterModeEnabled',
    default: true
  },
  isRegisteredOnURSM: {
    doc: 'boolean indicating whether or not node has been registered on dataContracts UserReplicaSetManager contract (URSM)',
    format: Boolean,
    default: false
    // `env` property is not defined as this should never be passed in as an envvar and should only be set programatically
  },
  spID: {
    doc: 'ID of creator node in ethContracts ServiceProviderFactory',
    format: Number,
    env: 'spID',
    default: 0
  },
  discoveryProviderWhitelist: {
    doc: 'Whitelisted discovery providers to select from (comma-separated)',
    format: String,
    env: 'discoveryProviderWhitelist',
    default: ''
  },
  discoveryNodeUnhealthyBlockDiff: {
    doc: 'Number of missed blocks after which a discovery node would be considered unhealthy',
    format: 'nat',
    env: 'discoveryNodeUnhealthyBlockDiff',
    default: 15
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
    default: 97
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
  considerNodeUnhealthy: {
    doc: 'Flag to mark the node as unhealthy (health_check will 200 but healthy: false in response). Wont be selected in replica sets, other nodes will roll this node off replica sets for their users',
    format: Boolean,
    env: 'considerNodeUnhealthy',
    default: false
  },
  premiumContentEnabled: {
    doc: 'whether or not to enable premium content',
    format: Boolean,
    env: 'premiumContentEnabled',
    default: false
  },
  backgroundDiskCleanupCheckEnabled: {
    doc: 'whether DiskManager.sweepSubdirectoriesInFiles() should run',
    format: Boolean,
    env: 'backgroundDiskCleanupCheckEnabled',
    default: true
  },
  backgroundDiskCleanupDeleteEnabled: {
    doc: 'whether DiskManager.sweepSubdirectoriesInFiles() should actually delete from disk',
    format: Boolean,
    env: 'backgroundDiskCleanupDeleteEnabled',
    default: true
  },
  fetchCNodeEndpointToSpIdMapIntervalMs: {
    doc: 'interval (ms) to update the cNodeEndpoint->spId mapping',
    format: 'nat',
    env: 'fetchCNodeEndpointToSpIdMapIntervalMs',
    default: 600_000 // 10m
  },
  otelTracingEnabled: {
    doc: 'enable OpenTelemetry tracing',
    format: Boolean,
    env: 'otelTracingEnabled',
    default: true
  },
  otelCollectorUrl: {
    doc: 'the url for the OpenTelemetry collector',
    format: String,
    env: 'otelCollectorUrl',
    default: ''
  },
  findCIDInNetworkEnabled: {
    doc: 'enable findCIDInNetwork lookups',
    format: Boolean,
    env: 'findCIDInNetworkEnabled',
    default: true
  },
  skippedCIDsRetryQueueJobIntervalMs: {
    doc: 'Interval (ms) for SkippedCIDsRetryQueue Job Processing',
    format: 'nat',
    env: 'skippedCIDsRetryQueueJobIntervalMs',
    default: 3600000 // 1hr in ms
  },
  skippedCIDRetryQueueMaxAgeHr: {
    doc: 'Max age (hours) of skipped CIDs to retry in SkippedCIDsRetryQueue',
    format: 'nat',
    env: 'skippedCIDRetryQueueMaxAgeHr',
    default: 8760 // 1 year in hrs
  },
  contentCacheLayerEnabled: {
    doc: 'Flag to enable or disable the nginx cache layer that caches content. DO NOT SET THIS HERE, set in the Dockerfile because it needs to be set above the application layer',
    format: 'BooleanCustom',
    env: 'contentCacheLayerEnabled',
    default: true
  },
  trustedNotifierID: {
    doc: 'To select a trusted notifier, set to a value >= 1 corresponding to the index of the notifier on chain. 0 means no trusted notifier selected and self manage notifications',
    format: 'nat',
    env: 'trustedNotifierID',
    default: 1
  },
  nodeOperatorEmailAddress: {
    doc: 'Email address for the node operator where they will respond in a timely manner. Must be defined if trustedNotifierID is set to 0',
    format: String,
    env: 'nodeOperatorEmailAddress',
    default: ''
  },

  // // Uploads
  isReadOnlyMode: {
    doc: 'Flag indicating whether to run this node in read only mode (no writes)',
    format: Boolean,
    env: 'isReadOnlyMode',
    default: false
  },
  storagePath: {
    doc: 'File system path to store raw files that are uploaded',
    format: String,
    env: 'storagePath',
    default: '/file_storage'
  },
  allowedUploadFileExtensions: {
    doc: 'Override the default list of file extension allowed',
    format: Array,
    env: 'allowedUploadFileExtensions',
    default: [
      'mp2',
      'mp3',
      'mpga',
      'mp4',
      'm4a',
      'm4p',
      'm4b',
      'm4r',
      'm4v',
      'wav',
      'wave',
      'flac',
      'aif',
      'aiff',
      'aifc',
      'ogg',
      'ogv',
      'oga',
      'ogx',
      'ogm',
      'spx',
      'opus',
      '3gp',
      'aac',
      'amr',
      '3ga',
      'awb',
      'xwma',
      'webm',
      'ts',
      'tsv',
      'tsa'
    ]
  },
  maxAudioFileSizeBytes: {
    doc: 'Maximum file size for audio file uploads in bytes',
    format: 'nat',
    env: 'maxAudioFileSizeBytes',
    default: 1_000_000_000
  },
  maxMemoryFileSizeBytes: {
    doc: 'Maximum memory usage for audio file uploads in bytes',
    format: 'nat',
    env: 'maxMemoryFileSizeBytes',
    default: 50_000_000
  },
  transcodingMaxConcurrency: {
    doc: 'Maximum ffmpeg processes to spawn concurrently. If unset (-1), set to # of CPU cores available',
    format: Number,
    env: 'transcodingMaxConcurrency',
    default: -1
  },
  imageProcessingMaxConcurrency: {
    doc: 'Maximum image resizing processes to spawn concurrently. If unset (-1), set to # of CPU cores available',
    format: Number,
    env: 'imageProcessingMaxConcurrency',
    default: -1
  },
  deleteTrackUploadArtifacts: {
    doc: 'whether or not to delete track upload artifacts from disk in `fileManager.removeTrackFolder()`',
    format: Boolean,
    env: 'deleteTrackUploadArtifacts',
    default: false
  },
  enforceWriteQuorum: {
    doc: 'Boolean flag indicating whether or not primary should reject write until 2/3 replication across replica set',
    format: Boolean,
    env: 'enforceWriteQuorum',
    default: false
  },
  maximumTranscodingActiveJobs: {
    doc: 'The maximum number of active jobs the TranscodingQueue can have at a given moment. Will be the number of cores in the running machine, or a custom size',
    format: 'nat',
    env: 'maximumTranscodingActiveJobs',
    default: os.cpus().length
  },
  maximumTranscodingWaitingJobs: {
    doc: 'The maximum number of waiting jobs the TranscodingQueue can have at a given moment. Will be the number of cores in the running machine, or a custom size',
    format: 'nat',
    env: 'maximumTranscodingWaitingJobs',
    default: os.cpus().length
  },

  // // FFMPEG
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

  // // Rate limits
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
    default:
      '{"/image_upload":{"post":[{"expiry":60,"max":100}]},"/users":{"post":[{"expiry":60,"max":100}]},"/users/login/challenge":{"post":[{"expiry":60,"max":100}]},"/users/logout":{"post":[{"expiry":60,"max":100}]},"/users/batch_clock_status":{"post":[{"expiry":60,"max":100}]},"/track_content":{"post":[{"expiry":60,"max":100}]},"/tracks/metadata":{"post":[{"expiry":60,"max":100}]},"/tracks":{"post":[{"expiry":60,"max":100}]},"/audius_users/metadata":{"post":[{"expiry":60,"max":100}]},"/audius_users":{"post":[{"expiry":60,"max":100}]},"/sync":{"post":[{"expiry":60,"max":500}]},"/vector_clock_sync":{"post":[{"expiry":60,"max":500}]}}'
  },
  rateLimitingAudiusUserReqLimit: {
    doc: 'Total requests per hour rate limit for /audius_user routes',
    format: 'nat',
    env: 'rateLimitingAudiusUserReqLimit',
    default: 3000
  },
  rateLimitingUserReqLimit: {
    doc: 'Total requests per hour rate limit for /users routes',
    format: 'nat',
    env: 'rateLimitingUserReqLimit',
    default: 60000
  },
  rateLimitingMetadataReqLimit: {
    doc: 'Total requests per hour rate limit for /metadata routes',
    format: 'nat',
    env: 'rateLimitingMetadataReqLimit',
    default: 3000
  },
  rateLimitingImageReqLimit: {
    doc: 'Total requests per hour rate limit for /image_upload routes',
    format: 'nat',
    env: 'rateLimitingImageReqLimit',
    default: 6000
  },
  rateLimitingTrackReqLimit: {
    doc: 'Total requests per hour rate limit for /track routes',
    format: 'nat',
    env: 'rateLimitingTrackReqLimit',
    default: 6000
  },
  rateLimitingBatchCidsExistLimit: {
    doc: 'Total requests per hour rate limit for /track routes',
    format: 'nat',
    env: 'rateLimitingBatchCidsExistLimit',
    default: 1
  },
  URSMRequestForSignatureReqLimit: {
    doc: 'Total requests per hour rate limit for /ursm_request_for_signature route',
    format: 'nat',
    env: 'URSMRequestForSignatureReqLimit',
    default: 30
  },

  // State machine
  stateMonitoringQueueRateLimitInterval: {
    doc: 'interval (ms) during which at most stateMonitoringQueueRateLimitJobsPerInterval monitor-state jobs will run',
    format: 'nat',
    env: 'stateMonitoringQueueRateLimitInterval',
    default: 60_000 // 1m
  },
  stateMonitoringQueueRateLimitJobsPerInterval: {
    doc: 'number of state monitoring jobs that can run in each interval (0 to pause queue)',
    format: 'nat',
    env: 'stateMonitoringQueueRateLimitJobsPerInterval',
    default: 3
  },
  peerHealthCheckRequestTimeout: {
    doc: 'Timeout [ms] for checking health check route',
    format: 'nat',
    env: 'peerHealthCheckRequestTimeout',
    default: 2000
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
    doc: 'Minimum percentage of failed syncs to be considered healthy in peer health computation',
    format: 'nat',
    env: 'minimumSuccessfulSyncCountPercentage',
    // TODO: Update to higher percentage when higher threshold of syncs are passing
    default: 0
  },
  minimumSecondaryUserSyncSuccessPercent: {
    doc: 'Minimum percent of successful Syncs for a user on a secondary for the secondary to be considered healthy for that user. Ensures that a single failure will not cycle out secondary.',
    format: 'nat',
    env: 'minimumSecondaryUserSyncSuccessPercent',
    default: 50
  },
  minimumFailedSyncRequestsBeforeReconfig: {
    doc: '[on Primary] Minimum number of failed SyncRequests from Primary before it cycles Secondary out of replica set',
    format: 'nat',
    env: 'minimumFailedSyncRequestsBeforeReconfig',
    default: 20
  },
  maxNumberSecondsPrimaryRemainsUnhealthy: {
    doc: "Max number of seconds since first failed health check before a primary's users start issuing replica set updates",
    format: 'nat',
    env: 'maxNumberSecondsPrimaryRemainsUnhealthy',
    default: 3600 // 1 hour in s
  },
  maxNumberSecondsSecondaryRemainsUnhealthy: {
    doc: "Max number of seconds since first failed health check before a secondary's users start issuing replica set updates",
    format: 'nat',
    env: 'maxNumberSecondsSecondaryRemainsUnhealthy',
    default: 600 // 10min in s
  },
  secondaryUserSyncDailyFailureCountThreshold: {
    doc: 'Max number of sync failures for a secondary for a user per day before stopping further SyncRequest issuance',
    format: 'nat',
    env: 'secondaryUserSyncDailyFailureCountThreshold',
    default: 20
  },
  maxSyncMonitoringDurationInMs: {
    doc: 'Max duration that primary will monitor secondary for syncRequest completion for non-manual syncs',
    format: 'nat',
    env: 'maxSyncMonitoringDurationInMs',
    default: 300000 // 5min (prod default)
  },
  maxManualSyncMonitoringDurationInMs: {
    doc: 'Max duration that primary will monitor secondary for syncRequest completion for manual syncs',
    format: 'nat',
    env: 'maxManualSyncMonitoringDurationInMs',
    default: 45000 // 45 sec (prod default)
  },
  maxBatchClockStatusBatchSize: {
    doc: 'Maximum number of wallets the /users/batch_clock_status route will accept at one time',
    format: 'nat',
    env: 'maxBatchClockStatusBatchSize',
    default: 5000
  },
  monitorStateJobLastSuccessfulRunDelayMs: {
    doc: 'Max time delay since last monitor-state job successfully ran (milliseconds)',
    format: 'nat',
    env: 'monitorStateJobLastSuccessfulRunDelayMs',
    default: 10 * 60 * 1000 // 10 mins
  },
  findSyncRequestsJobLastSuccessfulRunDelayMs: {
    doc: 'Max time delay since last find-sync-requests job successfully ran (milliseconds)',
    format: 'nat',
    env: 'findSyncRequestsJobLastSuccessfulRunDelayMs',
    default: 10 * 60 * 1000 // 10 mins
  },
  debounceTime: {
    doc: 'sync debounce time in ms',
    format: 'nat',
    env: 'debounceTime',
    default: 0 // 0ms
  },
  maxExportClockValueRange: {
    doc: 'Maximum range of clock values to export at once to prevent process OOM',
    format: Number,
    env: 'maxExportClockValueRange',
    default: 10000
  },
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
    default: 45000 // 45 seconds (prod default)
  },
  recordSyncResults: {
    doc: 'Flag to record sync results. If enabled sync results (successes and failures) will be recorded. This flag is not intended to be permanent.',
    format: Boolean,
    env: 'recordSyncResults',
    default: false
  },
  processSyncResults: {
    doc: 'Flag to process sync results. If enabled, syncs may be capped for a day depending on sync results. Else, do not process sync results. This flag is not intended to be permanent.',
    format: Boolean,
    env: 'processSyncResults',
    default: false
  },
  manualSyncsDisabled: {
    doc: 'Disables issuing of manual syncs in order to test state machine Recurring Sync logic.',
    format: 'BooleanCustom',
    env: 'manualSyncsDisabled',
    default: false
  },
  maxManualRequestSyncJobConcurrency: {
    doc: 'Max bull queue concurrency for manual sync request jobs',
    format: 'nat',
    env: 'maxManualRequestSyncJobConcurrency',
    default: 30
  },
  maxRecurringRequestSyncJobConcurrency: {
    doc: 'Max bull queue concurrency for recurring sync request jobs',
    format: 'nat',
    env: 'maxRecurringRequestSyncJobConcurrency',
    default: 20
  },
  mergePrimaryAndSecondaryEnabled: {
    doc: 'True to enable issuing sync requests with sync mode = mergePrimaryAndSecondary',
    format: Boolean,
    env: 'mergePrimaryAndSecondaryEnabled',
    default: true
  },

  // // Orphaned data recovery
  recoverOrphanedDataQueueRateLimitInterval: {
    doc: 'interval (ms) during which at most recoverOrphanedDataQueueRateLimitJobsPerInterval recover-orphaned-data jobs will run',
    format: 'nat',
    env: 'recoverOrphanedDataQueueRateLimitInterval',
    default: 60_000 // 1m
  },
  recoverOrphanedDataQueueRateLimitJobsPerInterval: {
    doc: 'number of recover-orphaned-data jobs that can run in each interval (0 to pause queue)',
    format: 'nat',
    env: 'recoverOrphanedDataQueueRateLimitJobsPerInterval',
    default: 1
  },
  recoverOrphanedDataNumUsersPerBatch: {
    doc: 'number of users to fetch from redis and issue requests for (sequentially) in each batch',
    format: 'nat',
    env: 'recoverOrphanedDataNumUsersPerBatch',
    default: 5
  },
  recoverOrphanedDataDelayMsBetweenBatches: {
    doc: 'milliseconds to wait between processing each recoverOrphanedDataNumUsersPerBatch users',
    format: 'nat',
    env: 'recoverOrphanedDataDelayMsBetweenBatches',
    default: 60_000 // 1m
  },

  // // Replica set update
  reconfigModePrimaryOnly: {
    doc: 'Override for `snapbackHighestReconfigMode` to only reconfig primary from replica set',
    format: Boolean,
    env: 'reconfigModePrimaryOnly',
    default: false
  },
  entityManagerReplicaSetEnabled: {
    doc: 'whether or not to use entity manager to update the replica set',
    format: Boolean,
    env: 'entityManagerReplicaSetEnabled',
    default: false
  },
  syncForceWipeDBEnabled: {
    doc: "whether or not this node can wipe a user's data from its database during a sync (true = wipe allowed)",
    format: Boolean,
    env: 'syncForceWipeDBEnabled',
    default: true
  },
  syncForceWipeDiskEnabled: {
    doc: "whether or not this node can wipe a user's data from its disk after DB deletion during a sync (true = wipe allowed)",
    format: Boolean,
    env: 'syncForceWipeDiskEnabled',
    default: false
  },
  reconfigNodeWhitelist: {
    doc: 'Comma separated string - list of Content Nodes to select from for reconfig. Empty string = whitelist all.',
    format: String,
    env: 'reconfigNodeWhitelist',
    default: ''
  },
  reconfigSPIdBlacklistString: {
    doc: 'A comma separated list of sp ids of nodes to not reconfig onto. Used to create the `reconfigSPIdBlacklist` number[] config. Defaulted to prod foundation nodes and any node > 75% storage utilization.',
    format: String,
    env: 'reconfigSPIdBlacklistString',
    default: '1,4,33,37,39,40,41,42,43,52,56,58,59,60,61,64,65'
  },
  maxUpdateReplicaSetJobConcurrency: {
    doc: 'Max bull queue concurrency for update replica set jobs',
    format: 'nat',
    env: 'maxUpdateReplicaSetJobConcurrency',
    default: 10
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
  findReplicaSetUpdatesJobLastSuccessfulRunDelayMs: {
    doc: 'Max time delay since last find-replica-set-updates job successfully ran (milliseconds)',
    format: 'nat',
    env: 'findReplicaSetUpdatesJobLastSuccessfulRunDelayMs',
    default: 10 * 60 * 1000 // 10 mins
  },

  // // Snapback (legacy)
  snapbackHighestReconfigMode: {
    doc: 'Depending on the reconfig op, issue a reconfig or not. See snapbackSM.js for the modes.',
    format: String,
    env: 'snapbackHighestReconfigMode',
    default: 'PRIMARY_AND_OR_SECONDARIES'
  },
  snapbackModuloBase: {
    doc: 'The modulo base to segment users by on snapback. Will process `1/snapbackModuloBase` users at some snapback interval',
    format: 'nat',
    env: 'snapbackModuloBase',
    default: 48
  },
  snapbackUsersPerJob: {
    doc: 'Maximum number of users to process in each SnapbackSM job',
    format: 'nat',
    env: 'snapbackUsersPerJob',
    default: 2000
  },
  disableSnapback: {
    doc: 'True to not run any snapback queues (old state machine and old syncs)',
    format: Boolean,
    env: 'disableSnapback',
    default: true
  }
})

/*
 * If you wanted to load a file, this is lower precendence than env variables.
 * So if registryAddress or ownerWallet env variables are defined, they take precendence.
 */

const pathTo = (fileName) => path.join(process.cwd(), fileName)

if (fs.existsSync(pathTo('eth-contract-config.json'))) {
  const ethContractConfig = require(pathTo('eth-contract-config.json'))
  config.load({
    ethTokenAddress: ethContractConfig.audiusTokenAddress,
    ethRegistryAddress: ethContractConfig.registryAddress,
    ethOwnerWallet: ethContractConfig.ownerWallet,
    ethWallets: ethContractConfig.allWallets
  })
}

if (fs.existsSync(pathTo('contract-config.json'))) {
  const dataContractConfig = require(pathTo('contract-config.json'))
  config.load({
    dataRegistryAddress: dataContractConfig.registryAddress
  })
}

// Set reconfigSPIdBlacklist based off of reconfigSPIdBlacklistString
config.set(
  'reconfigSPIdBlacklist',
  _.isEmpty(config.get('reconfigSPIdBlacklistString'))
    ? []
    : config
        .get('reconfigSPIdBlacklistString')
        .split(',')
        .filter((e) => e)
        .map((e) => parseInt(e))
)

// Perform validation and error any properties are not present on schema
config.validate()

// Retrieves and populates IP info configs
const asyncConfig = async () => {
  try {
    const ipinfo = await axios.get('https://ipinfo.io')
    const country = ipinfo.data.country
    const [lat, long] = ipinfo.data.loc.split(',')

    if (!config.get('serviceCountry')) config.set('serviceCountry', country)
    if (!config.get('serviceLatitude')) config.set('serviceLatitude', lat)
    if (!config.get('serviceLongitude')) config.set('serviceLongitude', long)
  } catch (e) {
    console.error(
      `config.js:asyncConfig(): Failed to retrieve IP info || ${e.message}`
    )
  }
}

config.asyncConfig = asyncConfig

module.exports = config
