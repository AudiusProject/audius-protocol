FROM node:14

ENV WORKDIR /app
WORKDIR ${WORKDIR}

COPY package.json .
RUN npm install

COPY main.js .
CMD npm run exporter
