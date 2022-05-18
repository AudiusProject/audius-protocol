#!/usr/bin/env bash

set -ex

cd /tmp

ELASTIC_AGENT_URL=$(echo dXNlcgo= | base64 --decode)
ELASTIC_AGENT_TOKEN=$(echo cGFzcwo= | base64 --decode)

# install Elastic Agent
ELASTIC_AGENT_VERSION=elastic-agent-8.2.0-linux-x86_64
curl -L -O \
	https://artifacts.elastic.co/downloads/beats/elastic-agent/${ELASTIC_AGENT_VERSION}.tar.gz
tar xzvf ${ELASTIC_AGENT_VERSION}.tar.gz
cd ${ELASTIC_AGENT_VERSION}
sudo ./elastic-agent install -f \
	--url=${ELASTIC_AGENT_URL} \
	--enrollment-token=${ELASTIC_AGENT_TOKEN}
