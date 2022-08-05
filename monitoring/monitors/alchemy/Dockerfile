FROM node:14

ENV WORKDIR /app
WORKDIR ${WORKDIR}

COPY package.json .
RUN npm install \
    && npm install -g \
        nodemon

COPY main.js .
CMD nodemon --watch . main.js
