export CRAWLERS=`tr '\n' '|' < /home/nginx/crawlers.txt` &&
echo "$CRAWLERS" &&
envsubst '$$APP_URL $$API_SUBDOMAIN $$ACCESS_TOKEN $$CRAWLERS $$BEDTIME_URL' < /home/nginx/nginx.template > /etc/nginx/nginx.conf &&
exec nginx -g 'daemon off;'
