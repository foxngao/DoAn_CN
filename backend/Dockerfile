FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS dev

ENV NODE_ENV=development

RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]

FROM base AS prod

ENV NODE_ENV=production

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

EXPOSE 4000

CMD ["npm", "start"]
