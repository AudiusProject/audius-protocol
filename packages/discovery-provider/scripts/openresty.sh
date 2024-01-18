#!/bin/bash
set -e

openresty -p /usr/local/openresty -c /usr/local/openresty/conf/nginx_container.conf
  tail -f /usr/local/openresty/logs/error.log | python3 scripts/openresty_log_convertor.py ERROR &
  tail -f /usr/local/openresty/logs/access.log
