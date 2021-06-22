# requires authentication to Dockerhub
FROM audius/contracts:1.0.0 as contracts

FROM python:3.8.0-alpine
MAINTAINER Hareesh Nagaraj <hareesh@audius.co>

ENV INSTALL_PATH /audius-discovery-provider
RUN mkdir -p $INSTALL_PATH
WORKDIR $INSTALL_PATH

COPY requirements.txt requirements.txt

RUN apk update && \
    apk add alpine-sdk && \
    apk add linux-headers && \
    apk add bash && \
    apk add postgresql-libs && \
    apk add libffi-dev && \
    apk add --virtual .build-deps gcc musl-dev postgresql-dev && \
    python3 -m pip install -r requirements.txt --no-cache-dir && \
    apk --purge del .build-deps

COPY . .

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait
COPY scripts/wait /wait

RUN chmod +x /wait

# Permission scripts directory
RUN chmod +x scripts

RUN mkdir -p ./build/contracts
COPY --from=contracts /usr/src/app/build/contracts/ ./build/contracts/

ARG git_sha
ENV GIT_SHA=$git_sha

CMD ["bash", "scripts/start.sh"]
