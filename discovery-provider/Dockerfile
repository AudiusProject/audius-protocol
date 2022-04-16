# requires authentication to Dockerhub
FROM audius/contracts:1.0.0 as contracts

FROM alpine:3.15
LABEL maintainer="Hareesh Nagaraj <hareesh@audius.co>"

ENV INSTALL_PATH /audius-discovery-provider
RUN mkdir -p $INSTALL_PATH
WORKDIR $INSTALL_PATH

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.15/main' >> /etc/apk/repositories && \
    apk update && \
    apk add \
        alpine-sdk \
        bash \
        cargo \
        docker \
        gcc \
        libffi-dev \
        libpq \
        libseccomp-dev \
        linux-headers \
        musl-dev \
        openssl-dev \
        postgresql \
        postgresql-client \
        postgresql-contrib \
        postgresql-dev \
        postgresql-libs \
        py3-pip \
        py3-wheel \
        python3 \
        python3-dev \
        redis \
        rsyslog \
        rust \
        sudo

# Add is important to ensure requirements are cached between runs
# https://stackoverflow.com/a/25307587
ADD requirements.txt requirements.txt

RUN \
    # Upgrade pip to accomodate anchor.py installation
    # https://github.com/kevinheavey/anchorpy/issues/63
    python3 -m pip install --upgrade pip && \
    python3 -m pip install -r requirements.txt --no-cache-dir

RUN echo 'http://mirror.leaseweb.com/alpine/v3.15/community' >> /etc/apk/repositories && \
    apk add wget && \
    wget 'http://openresty.org/package/admin@openresty.com-5ea678a6.rsa.pub' && \
    mv 'admin@openresty.com-5ea678a6.rsa.pub' /etc/apk/keys/ && \
    source /etc/os-release && \
    MAJOR_VER=`echo $VERSION_ID | sed 's/\.[0-9]\+$//'` && \
    echo "http://openresty.org/package/alpine/v$MAJOR_VER/main" | tee -a /etc/apk/repositories && \
    apk update && \
    apk add openresty && \
    apk add openresty-opm && \
    opm get spacewander/lua-resty-rsa && \
    opm get ledgetech/lua-resty-http && \
    mkdir /usr/local/openresty/conf && \
    mkdir /usr/local/openresty/logs

COPY . .

RUN cp ./nginx_conf/* /usr/local/openresty/conf/

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait
COPY scripts/wait /wait
RUN chmod +x /wait

# Permission scripts directory
RUN chmod +x scripts

RUN mkdir -p ./build/contracts
COPY --from=contracts /usr/src/app/build/contracts/ ./build/contracts/

RUN bash scripts/init-db.sh

ARG git_sha
ARG audius_loggly_disable
ARG audius_loggly_token
ARG audius_loggly_tags

ENV GIT_SHA=$git_sha
ENV audius_loggly_disable=$audius_loggly_disable
ENV audius_loggly_token=$audius_loggly_token
ENV audius_loggly_tags=$audius_loggly_tags

ENV PROMETHEUS_MULTIPROC_DIR /prometheus_data
RUN mkdir -p ${PROMETHEUS_MULTIPROC_DIR}

CMD ["bash", "scripts/start.sh"]
