
set -ex

export delegateOwnerWallet=$(printenv "CN_LOAD_TEST_SP_OWNER_ADDRESS")
export delegatePrivateKey=$(printenv "CN_LOAD_TEST_SP_OWNER_PRIVATE_KEY")
export spOwnerWallet=$(printenv "CN_LOAD_TEST_SP_OWNER_ADDRESS")
export creatorNodeEndpoint="http://audius-protocol-creator-node-load-test:4000"

docker run \
  -it \
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
