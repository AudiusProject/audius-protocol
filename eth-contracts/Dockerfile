# Uses separate stage for nodejs deps despite caching to avoid installing build tools
FROM node:18.16 as builder
COPY package*.json ./
RUN npm ci

FROM node:18-slim

WORKDIR /usr/src/app

COPY --from=builder /node_modules ./node_modules
COPY . .

RUN npm run postinstall

RUN ./scripts/setup-predeployed-ganache.sh /usr/db 1000000000000

ARG CONTENT_NODE_VERSION
ARG DISCOVERY_NODE_VERSION

RUN ./scripts/setup-dev.sh /usr/db 1000000000000

HEALTHCHECK --interval=5s --timeout=5s --retries=10 \
    CMD node -e "require('http').request('http://localhost:8545').end()" || exit 1

CMD ["npx", "ganache", "--server.host", "0.0.0.0", "--database.dbPath", "/usr/db", "--wallet.deterministic", "--wallet.totalAccounts", "50", "--chain.networkId", "1000000000000"]
