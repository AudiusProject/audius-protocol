#!/usr/bin/env bash

# This script:
# - installs python3 which is required by sshuttle
# - keeps /etc/hosts updated so sshuttle's auto-hosts functionality is fast

apk add python3 nmap

# Splits cidr to /24 ranges
function split_cidr {
  IFS=/ read raw_ip range <<<"$1"
  IFS=. read a b c d <<<"$raw_ip"

  ip=$((($a << 24) + ($b << 16) + ($c << 8) + $d))
  mask=$((0xffffffff << (32 - $range) & 0xffffffff))
  
  start_ip=$(($ip & $mask))
  end_ip=$(($ip | ($mask ^ 0xffffffff)))

  for i in $(seq $start_ip 0x100 $end_ip); do
    echo "$(($i >> 24)).$(($i >> 16 & 0xff)).$(($i >> 8 & 0xff)).$(($i & 0xff))/24"
  done
}

while sleep 5; do
  echo "Refreshing /etc/hosts"
  for cidr in $(split_cidr $(ip addr show eth0 | grep -Eo '(\d+\.){3}\d+/\d+')); do
    echo "Scanning $cidr"
    alive=$(nmap -n -sn -T5 $cidr | sed -n 's/^Nmap scan report for \(.*\)$/\1/p')
    if [[ -z "$alive" ]]; then  # stop scanning if a entire /24 range has no hosts to speed things up
      break
    fi

    for addr in $alive; do
      fqdn="$(nslookup "$addr" | sed -n 's/.*name = \(.*\)/\1/p')"
      hostname="$(sed -n 's/\([^\.]\+\).*/\1/p' <<< "$fqdn")"

      echo "Adding '$addr $fqdn $hostname' to /etc/hosts"
      grep -v "$addr" /etc/hosts > /tmp/hosts
      echo "$addr $fqdn $hostname" >> /tmp/hosts
      cp /tmp/hosts /etc/hosts
    done
  done
done
