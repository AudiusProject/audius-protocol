#!/usr/bin/env bash

# Add to /etc/hosts
grep -v audius-protocol /tmp/hosts >/tmp/hosts.new
cat >>/tmp/hosts.new <<EOF
127.0.0.1 audius-protocol-creator-node-1
127.0.0.1 audius-protocol-creator-node-2
127.0.0.1 audius-protocol-creator-node-3
127.0.0.1 audius-protocol-discovery-provider-1
EOF
mv /tmp/hosts.new /tmp/hosts

# Start reverse proxy
cat >/etc/nginx/conf.d/default.conf <<EOF
server {
    listen 4000;
    server_name audius-protocol-creator-node-1;

    location / {
    	resolver local=on;  # NOTE: local=on is only supposed in openresty
	set \$upstream http://audius-protocol-creator-node-1:4000;
    	proxy_pass \$upstream;
    	proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 4000;
    server_name audius-protocol-creator-node-2;

    location / {
    	resolver local=on;  # NOTE: local=on is only supposed in openresty
	set \$upstream http://audius-protocol-creator-node-2:4000;
    	proxy_pass \$upstream;
    	proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 4000;
    server_name audius-protocol-creator-node-3;

    location / {
    	resolver local=on;  # NOTE: local=on is only supposed in openresty
	set \$upstream http://audius-protocol-creator-node-3:4000;
    	proxy_pass \$upstream;
    	proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 5000;
    server_name audius-protocol-discovery-provider-1;

    location / {
    	resolver local=on;  # NOTE: local=on is only supposed in openresty
	set \$upstream http://audius-protocol-discovery-provider-1:4000;
    	proxy_pass \$upstream;
    	proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

nginx -g "daemon off;"
