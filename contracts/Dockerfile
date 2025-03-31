# Uses separate stage for nodejs deps despite caching to avoid installing build tools
FROM node:18.16 AS builder
COPY package*.json ./
RUN npm ci

FROM node:18-slim

WORKDIR /usr/src/app

COPY --from=builder package*.json ./
COPY --from=builder /node_modules ./node_modules

ARG bootstrapSPIds
ARG bootstrapSPDelegateWallets
ARG bootstrapSPOwnerWallets

COPY ./contracts ./contracts
COPY ./migrations ./migrations 
COPY ./scripts ./scripts 
COPY ./signature_schemas ./signature_schemas
COPY ./test ./test
COPY ./truffle-config.js ./contract-config.js ./

# Some of the build tools for truffle require these to exist, and so does one
# of our migrations (for the .audius one). Since we run this as a non-root user
# in CI, make these in the construction of the container or we won't have access
# to be able to make them
RUN mkdir /.audius
RUN mkdir /.config
RUN touch /.babel.json

RUN chmod 777 /.audius
RUN chmod 777 /.config
RUN chmod 777 /.babel.json

RUN chmod +x ./scripts/setup-predeployed-ganache.sh

RUN ./scripts/setup-predeployed-ganache.sh /usr/db 1000000000001

HEALTHCHECK --interval=5s --timeout=5s --retries=10 \
    CMD node -e "require('http').request('http://localhost:8545').end()" || exit 1

CMD ["npx", "ganache", "--server.host", "0.0.0.0", "--database.dbPath", "/usr/db", "--wallet.deterministic", "--wallet.totalAccounts", "50", "--chain.networkId", "1000000000001"]
