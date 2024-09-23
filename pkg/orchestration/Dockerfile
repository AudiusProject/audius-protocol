FROM docker:dind

RUN apk add bash git curl libc-dev gcc python3 py3-pip python3-dev linux-headers postgresql-client redis

VOLUME ["/var/k8s/creator-node-db-15", "/var/k8s/mediorum", "/var/k8s/creator-node-backend"]
VOLUME ["/var/k8s/discovery-provider-db", "/var/k8s/discovery-provider-chain"]
VOLUME ["/var/k8s/identity-service-db"]

# This comment modified 8/7/24 to force-rebuild the docker container

WORKDIR /root
RUN git clone https://github.com/AudiusProject/audius-docker-compose.git ./audius-docker-compose
WORKDIR /root/audius-docker-compose

RUN python3 -m venv .venv && source .venv/bin/activate && python3 -m pip install -r requirements.txt
COPY audius_cli_shim.sh /usr/local/bin/audius-cli
RUN chmod +x /usr/local/bin/audius-cli
