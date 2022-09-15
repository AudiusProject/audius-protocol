#!/bin/bash
set -x

link_libs=true

if [[ "$WAIT_HOSTS" != "" ]]; then
    /usr/bin/wait
fi

# enable rsyslog if not explicitly disabled by audius-docker-compose
: "${enableRsyslog:=true}"

# $enableRsyslog should be true
# $logglyDisable should be empty/null
# $logglyToken should be a nonzero length string
if $enableRsyslog && [[ -z "$logglyDisable" && -n "$logglyToken" ]]; then
    logglyTags=$(echo $logglyTags | python3 -c "print(' '.join(f'tag=\\\\\"{i}\\\\\"' for i in input().split(',')))")
    mkdir -p /var/spool/rsyslog
    mkdir -p /etc/rsyslog.d
    sed -i '1s|^|$MaxMessageSize 64k\n|' /etc/rsyslog.conf
    cat >/etc/rsyslog.d/22-loggly.conf <<EOF
\$WorkDirectory /var/spool/rsyslog # where to place spool files
\$ActionQueueFileName fwdRule1   # unique name prefix for spool files
\$ActionQueueMaxDiskSpace 1g    # 1gb space limit (use as much as possible)
\$ActionQueueSaveOnShutdown on   # save messages to disk on shutdown
\$ActionQueueType LinkedList    # run asynchronously
\$ActionResumeRetryCount -1    # infinite retries if host is down
template(name="LogglyFormat" type="string"
 string="<%pri%>%protocol-version% %timestamp:::date-rfc3339% %HOSTNAME% %app-name% %procid% %msgid% [$logglyToken@41058 $logglyTags \\"$creatorNodeEndpoint\\"] %msg%\n")
# Send messages to Loggly over TCP using the template.
action(type="omfwd" protocol="tcp" target="logs-01.loggly.com" port="514" template="LogglyFormat")
EOF
    rsyslogd
fi

if [ -z "$redisHost" ]; then
    redis-server --daemonize yes
    export redisHost=localhost
    export redisPort=6379
    export WAIT_HOSTS="localhost:6379"
    /usr/bin/wait
fi

if [ -z "$dbUrl" ]; then
    if [ -z "$(ls -A /db)" ]; then
        chown -R postgres:postgres /db
        chmod 700 /db
        sudo -u postgres pg_ctl init -D /db
        echo "host all all 0.0.0.0/0 md5" >>/db/pg_hba.conf
        echo "listen_addresses = '*'" >>/db/postgresql.conf
        sudo -u postgres pg_ctl start -D /db
        sudo -u postgres createdb audius_creator_node
    else
        sudo -u postgres pg_ctl start -D /db
    fi

    sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${postgres_password:-postgres}';"

    export dbUrl="postgres://postgres:${postgres_password:-postgres}@localhost:5432/audius_creator_node"
    export WAIT_HOSTS="localhost:5432"
    /usr/bin/wait
fi

if [[ "$contentCacheLayerEnabled" == "true" ]]; then
    openresty -p /usr/local/openresty -c /usr/local/openresty/conf/nginx.conf
fi

if [[ "$devMode" == "true" ]]; then
    if [ "$link_libs" = true ]; then
        cd ../audius-libs
        npm link
        cd ../app
        npm link @audius/sdk
        npx nodemon --exec 'node --inspect=0.0.0.0:${debuggerPort} --require ts-node/register src/index.ts' --watch src/ --watch ../audius-libs/dist | tee >(logger)
    else
        npx nodemon --exec 'node --inspect=0.0.0.0:${debuggerPort} --require ts-node/register src/index.ts' --watch src/ | tee >(logger)
    fi
else
    node --max-old-space-size=8192 build/src/index.js | tee >(logger)
fi

wait
