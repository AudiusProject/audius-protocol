#!/usr/bin/env bash

while read line 
do 
    status=$(curl -s $line/health_check?verbose=true | jq -r '.data | [.version, .block_difference, .elasticsearch.reposts.db_block_difference, .filesystem_used, .filesystem_size, .filesystem_used/.filesystem_size*100] | @tsv')
    echo -e "$line \t $status"
done < "${1:-/dev/stdin}"