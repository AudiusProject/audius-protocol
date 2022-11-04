FROM python:alpine3.16

ENV WORKDIR /app
WORKDIR ${WORKDIR}

RUN apk update \
    && apk add git \
    && git clone https://github.com/AudiusProject/audius-protocol.git

COPY requirements.txt ${WORKDIR}
RUN pip3 install -r requirements.txt

# TODO: remove after testing
COPY alerts.json audius-protocol/

COPY docker-entrypoint.sh relay.py ${WORKDIR}/

ENTRYPOINT ./docker-entrypoint.sh
CMD