#!/bin/bash

for programname in server worker beat; do
    size=$(stat --printf="%s" /var/log/discprov-$programname.log)
    if (($size >= 52428800)); then
        mv /var/log/discprov-$programname.log /var/log/discprov-$programname.log.old
    fi
done
