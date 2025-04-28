#!/bin/sh

# Print debug info
echo "Starting entrypoint.sh"
echo "Content of /usr/share/nginx/html:"
ls -la /usr/share/nginx/html/

# Print environment variables
echo "Environment variables:"
echo "BACKEND_URL: ${BACKEND_URL:-http://api.spearpoint.local:3001}"

# Set default BACKEND_URL if not provided
export BACKEND_URL=${BACKEND_URL:-http://api.spearpoint.local:3001}

# Replace environment variables in the nginx config
echo "Generating nginx config..."
envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Print the generated config
echo "Generated nginx config:"
cat /etc/nginx/conf.d/default.conf

# Create runtime config for React app (for client-side env variables)
echo "Generating runtime config for React app..."
cat > /usr/share/nginx/html/config.js << EOF
window.RUNTIME_CONFIG = {
  REACT_APP_API_URL: '${REACT_APP_API_URL:-/api}',
  APP_ENV: '${NODE_ENV:-production}'
};
EOF

# Print the generated config
echo "Generated runtime config:"
cat /usr/share/nginx/html/config.js

# Make sure the index.html includes our runtime config
if grep -q "config.js" /usr/share/nginx/html/index.html; then
  echo "config.js already included in index.html"
else
  echo "Adding config.js to index.html"
  sed -i 's/<head>/<head><script src="\/config.js"><\/script>/' /usr/share/nginx/html/index.html
fi

# Start nginx
echo "Starting nginx..."
exec nginx -g 'daemon off;'