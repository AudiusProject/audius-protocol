#!/usr/bin/env bash
echo -e "\n\n"

while read line 
do 
    echo $line
    curl -s $line/es_health
    echo -e "\n\n"
done < "${1:-/dev/stdin}"