# requires authentication to Dockerhub
FROM audius/contracts:1.0.0 AS contracts

FROM alpine:3.15
LABEL maintainer="Hareesh Nagaraj <hareesh@audius.co>"

ENV INSTALL_PATH /audius-discovery-provider
WORKDIR $INSTALL_PATH

ENV PROMETHEUS_MULTIPROC_DIR /prometheus_data
RUN mkdir -p ${PROMETHEUS_MULTIPROC_DIR}

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait
COPY scripts/wait /wait

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.10/main' >> /etc/apk/repositories && \
    echo 'http://dl-cdn.alpinelinux.org/alpine/v3.14/community' >> /etc/apk/repositories && \
    apk update && \
    apk add \
        alpine-sdk=1.0-r1 \
        bash=5.1.16-r0 \
        curl \
        docker \
        libffi-dev=3.4.2-r1 \
        libpq=11.12-r0 \
        libseccomp-dev \
        linux-headers=5.10.41-r0 \
        nodejs \
        npm \
        postgresql-client=11.12-r0 \
        postgresql-contrib=11.12-r0 \
        postgresql-dev=11.12-r0 \
        postgresql-libs=11.12-r0 \
        postgresql=11.12-r0 \
        py3-numpy \
        py3-pip \
        py3-scipy \
        py3-wheel \
        python3 \
        python3-dev \
        redis=6.2.7-r0 \
        rsyslog \
        sudo && \
    apk add --virtual .build-deps \
        gcc \
        musl-dev \
        postgresql-dev=11.12-r0

RUN echo 'http://mirror.leaseweb.com/alpine/v3.13/community' >> /etc/apk/repositories && \
    apk add wget && \
    wget 'http://openresty.org/package/admin@openresty.com-5ea678a6.rsa.pub' && \
    mv 'admin@openresty.com-5ea678a6.rsa.pub' /etc/apk/keys/ && \
    source /etc/os-release && \
    MAJOR_VER=`echo $VERSION_ID | sed 's/\.[0-9]\+$//'` && \
    echo "http://openresty.org/package/alpine/v$MAJOR_VER/main" | tee -a /etc/apk/repositories && \
    apk update && \
    apk add openresty=1.19.9.1-r0 openresty-opm && \
    opm get spacewander/lua-resty-rsa && \
    opm get ledgetech/lua-resty-http && \
    mkdir /usr/local/openresty/conf && \
    mkdir /usr/local/openresty/logs

COPY nginx_conf /usr/local/openresty/conf/

COPY scripts/init-db.sh scripts/init-db.sh
RUN bash scripts/init-db.sh

# Upgrade pip first to accomodate anchor.py installation
RUN python3 -m pip install --upgrade pip && \
    apk --purge del .build-deps
COPY requirements.txt requirements.txt
RUN python3 -m pip install -r requirements.txt --no-cache-dir

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
