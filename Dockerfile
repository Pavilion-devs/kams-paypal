# Kams API: PayPal, Claude on Bedrock, MCP. The Next.js web app is deployed separately (Vercel).
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data UPLOADS_DIR=/data/uploads API_PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server ./server
RUN mkdir -p /data/uploads && chown -R node:node /data
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
USER node
CMD ["node", "server/index.js"]
