FROM node:18.17-slim

RUN apt update && apt install -y python3 make gcc g++

ENV WORKDIR /app
WORKDIR ${WORKDIR}

COPY package.json package-lock.json ./
RUN npm install

COPY index.html tsconfig.json tsconfig.node.json vite.config.ts postcss.config.js tailwind.config.js ./
ADD src ./src
ADD workers-site ./workers-site

CMD npm run dev
