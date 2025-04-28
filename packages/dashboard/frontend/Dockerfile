# Build stage
FROM node:16-alpine as build

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies with specific TypeScript support
RUN npm install --legacy-peer-deps && \
    npm install typescript@4.9.5 --force

# Copy the entire frontend directory structure
COPY . ./

# Debug: Create a known working index.ts file as a test
RUN echo "Content of App.tsx:" && cat src/App.tsx && \
    echo "Content of index.tsx:" && cat src/index.tsx

# Add environment variables for build
ENV NODE_ENV=production
ENV CI=false
ENV PUBLIC_URL=/
ENV TSC_COMPILE_ON_ERROR=true
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true

# Explicitly check for and fix common import issues
RUN find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "from '\.\/.*\.tsx'" | xargs -r sed -i 's/from \('\.\(.*\)\.tsx'\)/from \1/g'

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output
COPY --from=build /app/build /usr/share/nginx/html

# Create a test HTML file to verify nginx is working
RUN echo '<!DOCTYPE html><html><head><title>SpearPoint Test</title></head><body><h1>SpearPoint Test Page</h1><p>This is a test page to verify nginx is serving files.</p></body></html>' > /usr/share/nginx/html/test.html

# Create a simple nginx configuration
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://api.spearpoint.local:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]