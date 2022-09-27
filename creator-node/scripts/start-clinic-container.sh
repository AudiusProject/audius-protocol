
set -ex

COMPOSE_PROJECT_NAME="cn2"
CREATOR_NODE_HOST_PORT=4040
CREATOR_NODE_DB_HOST_PORT=4433
CREATOR_NODE_REDIS_HOST_PORT=4380
CREATOR_NODE_DEBUGGER_PORT=9292
SP_OWNER_WALLET_INDEX=2


docker run \
  --name audius-protocol-creator-node-load-test \
  --network audius-protocol_default \
  --env-file $PROTOCOL_DIR/.env \
  -e logLevel="debug" \
  -e devMode="true" \
  -e creatorNodeIsDebug="true" \
  -e debuggerPort=10000 \
  -e rateLimitingAudiusUserReqLimit=3000 \
  -e rateLimitingUserReqLimit=3000 \
  -e rateLimitingMetadataReqLimit=3000 \
  -e rateLimitingImageReqLimit=6000 \
  -e rateLimitingTrackReqLimit=6000 \
  -e rateLimitingBatchCidsExistLimit=1 \
  -e maxAudioFileSizeBytes=250000000 \
  -e maxMemoryFileSizeBytes=50000000 \
  -e identityService="http://identity-service:7000" \
  -e ethProviderUrl="http://eth-ganache:8545" \
  -e ethTokenAddress="${ETH_TOKEN_ADDRESS}" \
  -e ethRegistryAddress="${ETH_REGISTRY_ADDRESS}" \
  -e ethOwnerWallet="${ETH_OWNER_WALLET}" \
  -e dataProviderUrl="http://poa-ganache:8545" \
  -e dataRegistryAddress="${POA_REGISTRY_ADDRESS}" \
  -e loadTest='true' \
  -v $PROTOCOL_DIR/creator-node/src:/usr/src/app/src \
  -v $PROTOCOL_DIR/libs:/usr/src/audius-libs \
  -v $PROTOCOL_DIR/dev-tools:/tmp/dev-tools \
  -v $PROTOCOL_DIR/creator-node/clinic:/usr/src/app/.clinic \
  --rm \
  audius-protocol-creator-node
