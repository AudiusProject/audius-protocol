#!/bin/env sh

name="$(nslookup "$(hostname -i)" | sed -n 's/.*name = \(.*\)/\1/p')"
main_host="$(echo "$name" | sed "s/-ingress//")"

if [[ "$name" =~ ".*-discovery-.*" ]]; then
  nats_host="$(echo "$main_host" | sed "s/discovery/nats-discovery/")"
  server_location="comms"
  main_port=8925
else # storage
  nats_host="$(echo "$main_host" | sed "s/storage/nats-storage/")"
  server_location="storage"
  main_port=8926
fi

cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen 80;

    location /nats {
        resolver 127.0.0.11 valid=1s;
        set \$upstream $nats_host;  # done to avoid resolve at startup
        proxy_pass http://\$upstream:8924;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /$server_location {
        resolver 127.0.0.11 valid=1s;
        set \$upstream $main_host;  # done to avoid resolve at startup
        proxy_pass http://\$upstream:$main_port;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

        # for websockets:
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

nginx -g 'daemon off;'
