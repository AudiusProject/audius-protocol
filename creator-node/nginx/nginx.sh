mkdir -p /home/nginx/temp
echo "hello"
cp /home/nginx/nginx.conf /etc/nginx/nginx.conf
exec nginx -g 'daemon off;'
# nginx -s reload