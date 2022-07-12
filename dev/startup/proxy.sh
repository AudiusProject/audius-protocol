#!/usr/bin/env sh

apk add bind-tools

while sleep 1; do
  # iterate through all discovery-provider ips
  for ip in $(dig +short discovery-provider); do
    # check if a file exists with the name of the ip (this file serves as a lock)
    if [ ! -e "$ip" ]; then
      name=$(nslookup $ip | grep -o "discovery-provider-[0-9]\+") # find hostname of the ip
      replica=$(echo $name | grep -o "[0-9]\+")                   # extract replia number from hostname

      # forward traffic on port 5000 + replica - 1 to the ip
      # see https://unix.stackexchange.com/questions/10428/simple-way-to-create-a-tunnel-from-one-local-port-to-another/101906#comment777872_101906 for more details
      nc -v -lk -p $((5000 + $replica - 1)) -e nc $ip 5000 &

      touch $ip # create a file with the name of the ip (this file serves as a lock)
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
