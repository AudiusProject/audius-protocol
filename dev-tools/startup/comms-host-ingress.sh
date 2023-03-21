#!/usr/bin/env bash

# Add to /etc/hosts
grep -v comms /tmp/hosts > /tmp/hosts.new
cat >>/tmp/hosts.new <<EOF
127.0.0.1 comms-storage-ingress-1
127.0.0.1 comms-storage-ingress-2
127.0.0.1 comms-storage-ingress-3
127.0.0.1 comms-storage-ingress-4
127.0.0.1 comms-discovery-ingress-1
127.0.0.1 comms-discovery-ingress-2
127.0.0.1 comms-discovery-ingress-3
EOF
mv /tmp/hosts.new /tmp/hosts

# Start reverse proxy
cat >/etc/nginx/conf.d/default.conf <<EOF
server {
    listen 80;
    server_name storage-ingress-1;

    location / {
    	resolver local=on;  # NOTE: local=on is only supposed in openresty
	set \$upstream http://storage-ingress-1;
    	proxy_pass \$upstream;
    	proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name storage-ingress-2;

    location / {
    	resolver local=on;  # NOTE: local=on is only supposed in openresty
	set \$upstream http://storage-ingress-2;
    	proxy_pass \$upstream;
    	proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name storage-ingress-3;

    location / {
    	resolver local=on;  # NOTE: local=on is only supposed in openresty
	set \$upstream http://storage-ingress-3;
    	proxy_pass \$upstream;
    	proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name storage-ingress-4;

    location / {
    	resolver local=on;  # NOTE: local=on is only supposed in openresty
	set \$upstream http://storage-ingress-4;
    	proxy_pass \$upstream;
    	proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name discovery-ingress-1;

    location / {
    	resolver local=on;  # NOTE: local=on is only supposed in openresty
	set \$upstream http://discovery-ingress-1;
    	proxy_pass \$upstream;
    	proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name discovery-ingress-2;

    location / {
    	resolver local=on;  # NOTE: local=on is only supposed in openresty
	set \$upstream http://discovery-ingress-2;
    	proxy_pass \$upstream;
    	proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name discovery-ingress-3;

    location / {
    	resolver local=on;  # NOTE: local=on is only supposed in openresty
	set \$upstream http://discovery-ingress-3;
    	proxy_pass \$upstream;
    	proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

nginx -g "daemon off;"
