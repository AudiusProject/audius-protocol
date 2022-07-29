# requires authentication to Dockerhub
FROM audius/contracts:1.0.0 AS contracts

FROM alpine:3.14
LABEL maintainer="Hareesh Nagaraj <hareesh@audius.co>"

ENV INSTALL_PATH /audius-discovery-provider
WORKDIR $INSTALL_PATH

ENV PROMETHEUS_MULTIPROC_DIR /prometheus_data
RUN mkdir -p ${PROMETHEUS_MULTIPROC_DIR}

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait
COPY scripts/wait /wait

RUN apk update && \
    apk add \
        alpine-sdk \
        bash \
        curl \
        docker \
        libffi-dev \
        libseccomp-dev \
        linux-headers \
        nodejs \
        npm \
        py3-numpy \
        py3-pip \
        py3-scipy \
        py3-wheel \
        python3 \
        python3-dev \
        redis \
        rsyslog \
        sudo \
        gcc \
        musl-dev

RUN curl -O 'http://openresty.org/package/admin@openresty.com-5ea678a6.rsa.pub' && \
    mv 'admin@openresty.com-5ea678a6.rsa.pub' /etc/apk/keys/ && \
    source /etc/os-release && \
    MAJOR_VER=`echo $VERSION_ID | sed 's/\.[0-9]\+$//'` && \
    echo "http://openresty.org/package/alpine/v$MAJOR_VER/main" | tee -a /etc/apk/repositories && \
    apk update && \
    apk add openresty=1.19.9.1-r0 openresty-opm && \
    opm get spacewander/lua-resty-rsa && \
    opm get ledgetech/lua-resty-http && \
    mkdir /usr/local/openresty/conf /usr/local/openresty/logs

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.10/main' >> /etc/apk/repositories && \
    apk update && \
    apk add \
        libpq=11.12-r0 \
        postgresql-client=11.12-r0 \
        postgresql-contrib=11.12-r0 \
        postgresql-dev=11.12-r0 \
        postgresql-libs=11.12-r0 \
        postgresql=11.12-r0

COPY nginx_conf /usr/local/openresty/conf/

COPY scripts/init-db.sh scripts/init-db.sh
RUN bash scripts/init-db.sh

# Upgrade pip first to accomodate anchor.py installation
COPY requirements.txt requirements.txt
RUN python3 -m pip install --upgrade pip && python3 -m pip install -r requirements.txt --no-cache-dir

COPY . .
RUN cd es-indexer && npm install && npm run build

COPY --from=contracts /usr/src/app/build/contracts/ build/contracts/

ARG git_sha
ARG audius_loggly_disable
ARG audius_loggly_token
ARG audius_loggly_tags

ENV GIT_SHA=$git_sha
ENV audius_loggly_disable=$audius_loggly_disable
ENV audius_loggly_token=$audius_loggly_token
ENV audius_loggly_tags=$audius_loggly_tags

EXPOSE 5000

HEALTHCHECK --interval=5s --timeout=5s --retries=12 \
    CMD pgrep alembic || curl -f http://localhost:5000/health_check || exit 1

CMD ["bash", "scripts/start.sh"]