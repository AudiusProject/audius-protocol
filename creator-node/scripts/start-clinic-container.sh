
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
  -v $PROTOCOL_DIR/creator-node/clinic:/usr/src/app/.clinic \
  -v $PROTOCOL_DIR/creator-node/compose/env/tmp/file-storage-${SP_OWNER_WALLET_INDEX}:/file_storage \
  -v $PROTOCOL_DIR/creator-node/:/usr/src/app \
  -v /usr/src/app/node_modules \
  -v $PROTOCOL_DIR/libs:/usr/src/audius-libs \
  -v $PROTOCOL_DIR/solana-programs:/usr/src/solana-programs \
  -p ${CREATOR_NODE_HOST_PORT}:${CREATOR_NODE_HOST_PORT} \
  -p ${CREATOR_NODE_DEBUGGER_PORT}:${CREATOR_NODE_DEBUGGER_PORT} \
  --env-file ./compose/env/base.env \
  -e redisHost=${COMPOSE_PROJECT_NAME}_creator-node-redis_1 \
  -e dbUrl=postgres://postgres:postgres@${COMPOSE_PROJECT_NAME}_creator-node-db_1:5432/audius_creator_node \
  -e WAIT_HOSTS="${COMPOSE_PROJECT_NAME}_creator-node-db_1:5432, ${COMPOSE_PROJECT_NAME}_creator-node-redis_1:6379" \
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
  -e loadTest='true' \
  --rm \
  audius-protocol-creator-node
