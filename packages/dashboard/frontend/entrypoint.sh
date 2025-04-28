#!/bin/sh

# Print debug info
echo "Starting entrypoint.sh"
echo "Content of /usr/share/nginx/html:"
ls -la /usr/share/nginx/html/

# Print environment variables
echo "Environment variables:"
echo "BACKEND_URL: ${BACKEND_URL}"

# Replace environment variables in the nginx config
echo "Generating nginx config..."
envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Print the generated config
echo "Generated nginx config:"
cat /etc/nginx/conf.d/default.conf

# Start nginx
echo "Starting nginx..."
exec nginx -g 'daemon off;'