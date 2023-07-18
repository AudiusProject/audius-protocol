#!/usr/bin/env sh

### Environment Variables

if [[ "$dbUrl" == "" ]]; then
    export dbUrl="postgres://postgres:postgres@db:5432/creator_node_${replica}"
fi

# Unique to each node

export delegateOwnerWallet=$(printenv "CN${replica}_SP_OWNER_ADDRESS")
export delegatePrivateKey=$(printenv "CN${replica}_SP_OWNER_PRIVATE_KEY")

export spOwnerWallet=$(printenv "CN${replica}_SP_OWNER_ADDRESS")
export spID=$replica

export creatorNodeEndpoint="http://audius-protocol-creator-node-${replica}"

# Constants

export logLevel="debug"
export devMode="true"
export creatorNodeIsDebug="true"
export debuggerPort=10000

export identityService="http://identity-service:7000"

export rateLimitingAudiusUserReqLimit=3000
export rateLimitingUserReqLimit=3000
export rateLimitingMetadataReqLimit=3000
export rateLimitingImageReqLimit=6000
export rateLimitingTrackReqLimit=6000
export rateLimitingBatchCidsExistLimit=1
export maxAudioFileSizeBytes=250000000
export maxMemoryFileSizeBytes=50000000

export ethProviderUrl="http://eth-ganache:8545"
export ethTokenAddress="${ETH_TOKEN_ADDRESS}"
export ethRegistryAddress="${ETH_REGISTRY_ADDRESS}"
export ethOwnerWallet="${ETH_OWNER_WALLET}"
export dataProviderUrl="http://poa-ganache:8545"
export dataRegistryAddress="${POA_REGISTRY_ADDRESS}"

export storagePath=/file_storage
export port=4000
export redisPort=6379

# Sync / SnapbackSM configs
export snapbackModuloBase=3
export minimumDailySyncCount=5
export minimumRollingSyncCount=10
export minimumSuccessfulSyncCountPercentage=50
export secondaryUserSyncDailyFailureCountThreshold=100
export maxSyncMonitoringDurationInMs=10000                     # 10sec
export skippedCIDsRetryQueueJobIntervalMs=30000                # 30sec in ms
export fetchCNodeEndpointToSpIdMapIntervalMs=10000             #10sec in ms
export enforceWriteQuorum=true
export recoverOrphanedDataQueueRateLimitJobsPerInterval=1
export mergePrimaryAndSecondaryEnabled=true
export maxNumberSecondsPrimaryRemainsUnhealthy=30
export maxNumberSecondsSecondaryRemainsUnhealthy=10

# peerSetManager
export peerHealthCheckRequestTimeout=2000 # ms
export minimumMemoryAvailable=2000000000  # bytes; 2gb
export maxFileDescriptorsAllocatedPercentage=95
export maxNumberSecondsPrimaryRemainsUnhealthy=5
export maxNumberSecondsSecondaryRemainsUnhealthy=5

# Number of missed blocks after which we would consider a discovery node unhealthy
export discoveryNodeUnhealthyBlockDiff=10

export entityManagerAddress="0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B"

# Premium content
export premiumContentEnabled="true"

cd ../audius-libs
npm link

cd ../app
npm link @audius/sdk

# Run register script in background as it waits for the node to be healthy
node scripts/register.js &
