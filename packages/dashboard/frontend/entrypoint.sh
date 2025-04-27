#!/bin/sh

# Debug: Print the BACKEND_URL value
echo "Using BACKEND_URL: ${BACKEND_URL}"

# Replace environment variables in the nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Debug: Print the generated nginx config
echo "Generated Nginx configuration:"
cat /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'