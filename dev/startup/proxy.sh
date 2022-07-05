#!/usr/bin/env sh

apk add bind-tools

port=5000
for ip in $(dig +short discovery-provider); do
  name=$(nslookup $ip | grep -o "discovery-provider-[0-9]\+")
  replica=$(echo $name | grep -o "[0-9]\+")
  nc -v -lk -p $(($port + $replica - 1)) -e nc $ip 5000 &
done

port=4000
for ip in $(dig +short creator-node); do
  name=$(nslookup $ip | grep -o "creator-node-[0-9]\+")
  replica=$(echo $name | grep -o "[0-9]\+")
  nc -v -lk -p $(($port + $replica - 1)) -e nc $ip 4000 &
done

wait
