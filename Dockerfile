FROM node:18-alpine

WORKDIR /app

COPY backend-package.json ./package.json
RUN npm install

COPY server.js ./

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "server.js"]
