#!/usr/bin/env bash

# installs the Elastic Agent for Fleet
# https://www.elastic.co/guide/en/fleet/current/fleet-overview.html
# Fleet us allows us to auto-upgrade Elastic Agents, add integrations,
# and provide host-based metrics

set -ex

cd /tmp
ELASTIC_AGENT_URL=$(echo aHR0cHM6Ly84MTRhMTcyMzVkMDA0ZDEyYmIzMTVlOGQ0NjZlMzJlMy5mbGVldC51cy1jZW50cmFsMS5nY3AuY2xvdWQuZXMuaW86NDQzCg== | base64 -d)
ELASTIC_AGENT_TOKEN=$(echo YlVoRlIzWTBRVUpPWkdaamRVVjZWbDlzVUdZNlYwMTJUMDlpUmkxUlpIVkdNV0ZRVDBKdFIzTjJRUT09Cg== | base64 -d)

# install Elastic Agent
ELASTIC_AGENT_VERSION=elastic-agent-8.2.0-linux-x86_64
curl -L -O \
	https://artifacts.elastic.co/downloads/beats/elastic-agent/${ELASTIC_AGENT_VERSION}.tar.gz
tar xzvf ${ELASTIC_AGENT_VERSION}.tar.gz
cd ${ELASTIC_AGENT_VERSION}
sudo ./elastic-agent install -f \
	--url=${ELASTIC_AGENT_URL} \
	--enrollment-token=${ELASTIC_AGENT_TOKEN}
