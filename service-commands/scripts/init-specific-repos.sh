set -e
set -x

# setup service commands
cd $PROTOCOL_DIR/
cd service-commands/
npm install &

# setup mad dog
cd $PROTOCOL_DIR/
cd mad-dog/
npm install &

# no discovery provider setup needed
# 'pip install' is performed through Docker for development
# TODO: Revisit whether this is optimal after hot reloading for disc prov

# setup creator node
cd $PROTOCOL_DIR/
cd creator-node/
npm install &
npm install & #why does it not work without this?

# setup identity service
cd $PROTOCOL_DIR/
cd identity-service/
npm install --dev &

wait
