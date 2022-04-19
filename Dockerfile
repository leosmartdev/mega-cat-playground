# syntax=docker/dockerfile:1

FROM bitnami/node:16
ENV NODE_ENV=production

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "start"]