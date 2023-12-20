FROM node:18.17-slim

RUN apt update && apt install -y python3 make gcc g++

ENV WORKDIR /app
WORKDIR ${WORKDIR}

COPY index.html package.json postcss.config.js tailwind.config.js tsconfig.json tsconfig.node.json vite.config.ts ./
ADD src ./src
ADD public ./public
ADD scripts ./scripts
RUN chmod +x ./scripts/docker-entrypoint.sh

ENV DDEX_BASE_URL="/ddex/"
RUN npm install
