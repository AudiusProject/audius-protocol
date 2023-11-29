FROM node:18.17-slim

RUN apt update && \
    apt install -y \
    python3 \
    make \
    gcc \
    g++ \
    libusb-1.0-0-dev \
    libudev-dev \
    libsecret-1-dev \
    pkg-config && \
    rm -rf /var/lib/apt/lists/*

ENV WORKDIR /app
WORKDIR ${WORKDIR}

COPY .env* index.html package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts .
ADD src ./src
ADD public ./public
ADD scripts ./scripts
ADD types ./types
RUN chmod +x ./scripts/docker-entrypoint.sh

ENV DASHBOARD_BASE_URL="/dashboard/"
RUN npm install --legacy-peer-deps
