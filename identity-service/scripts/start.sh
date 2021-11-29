#!/bin/bash

/usr/bin/wait

if [[ -n "$logglyToken" ]]; then
    logglyTags=$(echo $logglyTags | python3 -c "print(' '.join(f'tag=\\\\\"{i}\\\\\"' for i in input().split(',')))")
    mkdir -p /var/spool/rsyslog
    mkdir -p /etc/rsyslog.d
    cat >/etc/rsyslog.d/22-loggly.conf <<EOF
\$WorkDirectory /var/spool/rsyslog # where to place spool files
\$ActionQueueFileName fwdRule1   # unique name prefix for spool files
\$ActionQueueMaxDiskSpace 1g    # 1gb space limit (use as much as possible)
\$ActionQueueSaveOnShutdown on   # save messages to disk on shutdown
\$ActionQueueType LinkedList    # run asynchronously
\$ActionResumeRetryCount -1    # infinite retries if host is down
template(name="LogglyFormat" type="string"
 string="<%pri%>%protocol-version% %timestamp:::date-rfc3339% %HOSTNAME% %app-name% %procid% %msgid% [$logglyToken@41058 $logglyTags] %msg%\n")
# Send messages to Loggly over TCP using the template.
action(type="omfwd" protocol="tcp" target="logs-01.loggly.com" port="514" template="LogglyFormat")
EOF
    rsyslogd
fi

node src/index.js | tee >(logger)
