# requires authentication to Dockerhub
FROM audius/contracts:1.0.0 as contracts

FROM alpine:3.13
LABEL maintainer="Hareesh Nagaraj <hareesh@audius.co>"

ENV INSTALL_PATH /audius-discovery-provider
RUN mkdir -p $INSTALL_PATH
WORKDIR $INSTALL_PATH

COPY requirements.txt requirements.txt

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.10/main' >> /etc/apk/repositories && \
    apk update && \
    apk add alpine-sdk && \
    apk add linux-headers && \
    apk add bash && \
    apk add libffi-dev && \
    apk add redis && \
    apk add sudo && \
    apk add go-ipfs && \
    apk add postgresql=11.12-r0 && \
    apk add postgresql-contrib=11.12-r0 && \
    apk add postgresql-libs=11.12-r0 && \
    apk add python3 && \
    apk add python3-dev && \
    apk add py3-pip && \
    apk add py3-wheel && \
    apk add --virtual .build-deps gcc musl-dev postgresql-dev=11.12-r0 && \
    python3 -m pip install -r requirements.txt --no-cache-dir && \
    apk --purge del .build-deps

COPY . .

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait
COPY scripts/wait /wait
RUN chmod +x /wait

RUN adduser --disabled-password postgres

# Permission scripts directory
RUN chmod +x scripts

RUN mkdir -p ./build/contracts
COPY --from=contracts /usr/src/app/build/contracts/ ./build/contracts/

RUN bash scripts/init-db.sh
RUN ipfs init --profile server

ARG git_sha
ENV GIT_SHA=$git_sha

CMD ["bash", "scripts/start.sh"]
