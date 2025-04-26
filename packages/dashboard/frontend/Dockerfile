FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'envsubst "\$BACKEND_URL" < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Create a simple HTML page
RUN mkdir -p /usr/share/nginx/html && \
    echo '<html><body><h1>SpearPoint Cloud Governance</h1><p>Temporary placeholder page.</p></body></html>' > /usr/share/nginx/html/index.html

# Set default backend URL
ENV BACKEND_URL=http://backend:3001

# Expose port 80
EXPOSE 80

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]