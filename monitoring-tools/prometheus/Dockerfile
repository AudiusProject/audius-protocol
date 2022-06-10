FROM node:14 as generator

WORKDIR /dist

COPY *.js *.json *.env.* ./

RUN npm install \
    && npm run generate-prom

FROM prom/prometheus:v2.33.4 

COPY --from=generator /dist/prometheus.yml /etc/prometheus/prometheus.yml

EXPOSE 9090

