FROM python:alpine3.16

ENV WORKDIR /app
WORKDIR ${WORKDIR}

RUN apt-get update \
    && apt-get install -y \
        git \
    && git clone https://github.com/AudiusProject/audius-protocol.git

COPY docker-entrypoint.sh requirements.txt ./
RUN pip3 install -r requirements.txt

# TODO: remove after testing
COPY alerts.json audius-protocol/

ENTRYPOINT docker-entrypoint.sh
CMD