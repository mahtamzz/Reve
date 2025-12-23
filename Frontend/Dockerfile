# ---- مرحله build ----
    FROM node:18-alpine AS build

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    RUN npm run build   # خروجی: dist
    
    # ---- مرحله سرو کردن با nginx ----
    FROM nginx:alpine
    
    # پاک کردن کانفیگ پیش‌فرض
    RUN rm -rf /usr/share/nginx/html/*
    
    # کپی کردن خروجی Vite
    COPY --from=build /app/dist /usr/share/nginx/html
    
    EXPOSE 80
    
    CMD ["nginx", "-g", "daemon off;"]
    