#!/bin/sh
# requires latest version
# apk add --update net-tools

if [ -z $PROTOCOL ]; then
    ps aux|grep logspout|grep -q "udp://" && {
        PROTOCOL=u
        ps aux|grep logspout|grep -q "tcp://" && {
            PROTOCOL=t${PROTOCOL}
        } || {
           :
        }

    } || {
        ps aux|grep logspout|grep -q "tcp://" && {
            PROTOCOL=t
        } || :
    }
else
  PROTOCOL=u
fi
echo "netstat -pn -${PROTOCOL}"

all_connections=$(netstat -pn -${PROTOCOL})

# check_logspout_is_ESTABLISHED
echo "$all_connections" |grep  "logspout" |grep  "ESTABLISHED" || {
    echo "Logspout is not up OR does not have an ESTABLISHED outgoing UDP connection"
    exit 99
}


PREV_all_udp_packets=$(netstat -s -${PROTOCOL} |grep -A6 "Udp:" | grep "packets sent"| grep -Eo "[0-9]*")
sleep 10
NOW_all_udp_packets=$(netstat -s -${PROTOCOL} |grep -A6 "Udp:" | grep "packets sent"| grep -Eo "[0-9]*")

diff_packets=$(( NOW_all_udp_packets - PREV_all_udp_packets  ))

[[ $diff_packets -gt 0 ]] && {
    echo "[OK] $diff_packets UDP packets sent in the last 10 seconds"

}|| {
    echo "Logspout is not sending any UDP packets"
    exit 99
}

echo "[OK] Logspout"
exit 0

