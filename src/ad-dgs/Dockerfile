FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY src/ad-dgs/package*.json ./
RUN npm install

COPY src/ad-dgs/tsconfig.json ./
COPY src/ad-dgs/src ./src

RUN npm run build

FROM node:22-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY src/ad-dgs/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 4010

CMD ["node", "dist/index.js"]
