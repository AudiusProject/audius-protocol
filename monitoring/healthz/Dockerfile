FROM node:18.17-slim

RUN apt update && apt install -y python3 make gcc g++

ENV WORKDIR /app
WORKDIR ${WORKDIR}

COPY index.html package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts .
ADD src ./src
ADD workers-site ./workers-site

ENV HEALTHZ_BASE_URL="/healthz/"
ENV HEALTHZ_BUILD_OUTPUT_DIR="healthz"
RUN npm install && npm run build

CMD npm run start
