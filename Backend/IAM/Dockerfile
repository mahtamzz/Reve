# --- Base image ---
FROM node:18

# --- Create app directory ---
WORKDIR /app

# --- Install dependencies ---
COPY package*.json ./
RUN npm install

# --- Copy app files ---
COPY . .

# --- Expose backend port ---
EXPOSE 3000

# --- Start the app ---
CMD ["node", "src/server.js"]
