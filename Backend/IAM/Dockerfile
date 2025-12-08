FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# --- Start the app ---
# CMD ["node", "src/server.js"]
CMD ["node", "index.js"]
