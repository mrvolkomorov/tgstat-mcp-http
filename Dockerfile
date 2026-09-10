FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# TGStat MCP token (required - set via Northflank/Cloud dashboard)
ENV TGSTAT_TOKEN=

# Port used by server.js
EXPOSE 8080

# Start the MCP HTTP bridge
CMD ["node", "server.js"]
