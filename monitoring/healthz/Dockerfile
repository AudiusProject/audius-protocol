FROM node:18.17-slim

RUN apt update && apt install -y python3 make gcc g++

ENV WORKDIR /app
WORKDIR ${WORKDIR}

COPY package.json package-lock.json ./

# Quick fix for CI where we don't run as root user
# https://stackoverflow.com/questions/14836053/how-can-i-change-the-cache-path-for-npm-or-completely-disable-the-cache-on-win
RUN npm config set cache ./.npm --global
RUN npm install

COPY index.html tsconfig.json tsconfig.node.json vite.config.ts postcss.config.js tailwind.config.js ./
ADD src ./src
ADD workers-site ./workers-site

CMD npm run dev
