FROM node:14

ENV WORKDIR /app
WORKDIR ${WORKDIR}

RUN npm init -y \
    && npm install --save \
        @alch/alchemy-web3 \
        console-stamp \
        prom-client \
    && npm install -g \
        nodemon

COPY main.js .

CMD nodemon --watch . main.js