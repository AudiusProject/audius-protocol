#!/usr/bin/env sh

apk add bind-tools

while sleep 1; do
  for ip in $(dig +short discovery-provider); do
    if [ ! -e "$ip" ]; then
      name=$(nslookup $ip | grep -o "discovery-provider-[0-9]\+")
      replica=$(echo $name | grep -o "[0-9]\+")
      nc -v -lk -p $((5000 + $replica - 1)) -e nc $ip 5000 &
      touch $ip
    fi
  done

  for ip in $(dig +short creator-node); do
    if [ ! -e "$ip" ]; then
      name=$(nslookup $ip | grep -o "creator-node-[0-9]\+")
      replica=$(echo $name | grep -o "[0-9]\+")
      nc -v -lk -p $((4000 + $replica - 1)) -e nc $ip 4000 &
      touch $ip
    fi
  done
done
