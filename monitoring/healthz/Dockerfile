FROM node:16.18-slim

RUN apt update
RUN apt install -y python3 make gcc g++

ENV WORKDIR /app
WORKDIR ${WORKDIR}

COPY index.html package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts .
ADD src ./src
ADD workers-site ./workers-site

ENV HEALTHZ_BASE_URL="/healthz/"
ENV HEALTHZ_BUILD_OUTPUT_DIR="healthz"
RUN npm install
RUN npm run build
RUN npm prune --production && npm cache clean --force
RUN apt remove -y --purge python3 make gcc g++ && apt autoremove -y
RUN rm -rf ./src ./workers-site index.html


CMD npm run start
