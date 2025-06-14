# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . ./
# Update .env file with Docker-specific URLs if necessary, or use build args
# For now, assuming the default .env URLs might work if backend is aliased as 'backend' in docker-compose
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:1.25-alpine
COPY --from=build /app/build /usr/share/nginx/html

# Add a custom Nginx configuration for React Router and potential API proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Example nginx.conf for React Router:
# server {
#   listen 80;
#   root /usr/share/nginx/html;
#   index index.html index.htm;
#
#   location / {
#     try_files $uri $uri/ /index.html;
#   }
#
#   # Optional: Proxy API requests to backend if frontend and backend are on same domain via Nginx
#   # location /api {
#   #   proxy_pass http://backend:8080; # Assuming backend service is named 'backend'
#   #   proxy_set_header Host $host;
#   #   proxy_set_header X-Real-IP $remote_addr;
#   #   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#   #   proxy_set_header X-Forwarded-Proto $scheme;
#   # }
# }

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
