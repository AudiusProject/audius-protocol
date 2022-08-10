FROM node:14.17.5 as generator

WORKDIR /dist

COPY *.js *.json *.env.* ./
COPY ymls ymls

ARG PROM_ENV
ENV PROM_ENV ${PROM_ENV}
RUN npm install \
    && npm run generate-prom

FROM prom/prometheus:v2.33.4 

COPY --from=generator /dist/prometheus.yml /etc/prometheus/prometheus.yml

EXPOSE 9090

