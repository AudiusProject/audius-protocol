
docker build \
    -f Dockerfile.load \
    -t creator-node-load-test \
    --rm \
    .

docker run \
     --network audius-protocol_default \
     -v $PROTOCOL_DIR/creator-node/.clinic:/usr/src/app/.clinic \
     -p 4040:80 \
     --rm \
     creator-node-load-test

    environment:
      - redisHost=${COMPOSE_PROJECT_NAME}_creator-node-redis_1
      - dbUrl=postgres://postgres:postgres@${COMPOSE_PROJECT_NAME}_creator-node-db_1:5432/audius_creator_node
      - WAIT_HOSTS=${COMPOSE_PROJECT_NAME}_creator-node-db_1:5432, ${COMPOSE_PROJECT_NAME}_creator-node-redis_1:6379
      - port=${CREATOR_NODE_HOST_PORT}
      - debuggerPort=${CREATOR_NODE_DEBUGGER_PORT}
      - spOwnerWalletIndex=${SP_OWNER_WALLET_INDEX}
      - delegateOwnerWallet=${delegateOwnerWallet}
      - delegatePrivateKey=${delegatePrivateKey}
      - creatorNodeEndpoint=${creatorNodeEndpoint}
      - manualSyncsDisabled=${manualSyncsDisabled}
      - devMode=${DEV_MODE}
      - spOwnerWallet=${spOwnerWallet}
      - contentCacheLayerEnabled=${contentCacheLayerEnabled}
    env_file:
      - ./env/base.env
    ports:
      - '${CREATOR_NODE_HOST_PORT}:${CREATOR_NODE_HOST_PORT}'
      - '${CREATOR_NODE_DEBUGGER_PORT}:${CREATOR_NODE_DEBUGGER_PORT}'
    volumes:
      - ./env/tmp/file-storage-${SP_OWNER_WALLET_INDEX}:/file_storage
      - ..:/usr/src/app
      # Prevent hiding node_modules on container with host volume
      # From https://github.com/barrysteyn/node-scrypt/issues/148
      - /usr/src/app/node_modules
      # Mount audius libs as a directory
      - ../../libs:/usr/src/audius-libs
      # Mount solana-programs
      - ../../solana-programs:/usr/src/solana-programs