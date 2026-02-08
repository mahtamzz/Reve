    FROM node:18-alpine AS build
    WORKDIR /app
    
    COPY package*.json ./
    
    RUN npm ci
    
    COPY . .
    
    RUN npm run build
    
    FROM nginx:1.27-alpine
    
    RUN rm -rf /usr/share/nginx/html/*
    
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    COPY --from=build /app/dist /usr/share/nginx/html
    
    EXPOSE 80
    
    HEALTHCHECK --interval=30s --timeout=3s \
      CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
    
    CMD ["nginx", "-g", "daemon off;"]
    