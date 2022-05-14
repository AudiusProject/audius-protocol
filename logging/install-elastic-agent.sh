#!/usr/bin/env bash

set -ex

cd ${PROTOCOL_DIR}/logging
. .env
cd /tmp

# install Elastic Agent
ELASTIC_AGENT_VERSION=elastic-agent-8.2.0-linux-x86_64
curl -L -O \
	https://artifacts.elastic.co/downloads/beats/elastic-agent/${ELASTIC_AGENT_VERSION}.tar.gz
tar xzvf ${ELASTIC_AGENT_VERSION}.tar.gz
cd ${ELASTIC_AGENT_VERSION}
sudo ./elastic-agent install -f \
	--url=${ELASTIC_AGENT_URL} \
	--enrollment-token=${ELASTIC_AGENT_TOKEN}
