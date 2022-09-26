
docker run \
  --network audius-protocol_default \
  --env-file ./env/base.env \
  -e redisHost=${COMPOSE_PROJECT_NAME}_creator-node-redis_1 \
  -e dbUrl=postgres://postgres:postgres@${COMPOSE_PROJECT_NAME}_creator-node-db_1:5432/audius_creator_node \
  -e WAIT_HOSTS=${COMPOSE_PROJECT_NAME}_creator-node-db_1:5432, ${COMPOSE_PROJECT_NAME}_creator-node-redis_1:6379 \
  -e port=${CREATOR_NODE_HOST_PORT} \
  -e debuggerPort=${CREATOR_NODE_DEBUGGER_PORT} \
  -e spOwnerWalletIndex=${SP_OWNER_WALLET_INDEX} \
  -e delegateOwnerWallet=${delegateOwnerWallet} \
  -e delegatePrivateKey=${delegatePrivateKey} \
  -e creatorNodeEndpoint=${creatorNodeEndpoint} \
  -e manualSyncsDisabled=${manualSyncsDisabled} \
  -e devMode=${DEV_MODE} \
  -e spOwnerWallet=${spOwnerWallet} \
  -e contentCacheLayerEnabled=${contentCacheLayerEnabled} \
  -e loadTest=true \

  -p ${CREATOR_NODE_HOST_PORT}:${CREATOR_NODE_HOST_PORT} \
  -p ${CREATOR_NODE_DEBUGGER_PORT}:${CREATOR_NODE_DEBUGGER_PORT} \

  # clinic output
  -v $PROTOCOL_DIR/creator-node/.clinic:/usr/src/app/.clinic \
  -v ./env/tmp/file-storage-${SP_OWNER_WALLET_INDEX}:/file_storage
  -v ..:/usr/src/app
  # Prevent hiding node_modules on container with host volume
  # From https://github.com/barrysteyn/node-scrypt/issues/148
  -v /usr/src/app/node_modules
  # Mount audius libs as a directory
  -v ../../libs:/usr/src/audius-libs
  # Mount solana-programs
  -v ../../solana-programs:/usr/src/solana-programs
  --rm \
  audius-protocol-creator-node