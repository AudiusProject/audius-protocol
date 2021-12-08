if [[ "$openrestyEnabled" == "true" ]]; then
    openresty -p /usr/local/openresty -c /usr/local/openresty/conf/nginx.conf
fi