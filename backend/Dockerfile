FROM node:20-slim

WORKDIR /app

# Install dependencies separately to leverage Docker cache
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the port (Cloud Run uses the $PORT env var)
EXPOSE 5000

CMD ["node", "server.js"]
