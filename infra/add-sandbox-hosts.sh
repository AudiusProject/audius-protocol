#!/bin/bash

DOMAINS=("prod-sandbox" "stage-sandbox" "dev-sandbox")
IP="127.0.0.1"
HOSTS_FILE="/etc/hosts"

for DOMAIN in "${DOMAINS[@]}"; do
    if ! grep -q "$DOMAIN" "$HOSTS_FILE"; then
        echo "Adding $DOMAIN to $HOSTS_FILE"
        echo "$IP $DOMAIN" | sudo tee -a "$HOSTS_FILE" > /dev/null
    else
        echo "$DOMAIN already exists in $HOSTS_FILE"
    fi
done
