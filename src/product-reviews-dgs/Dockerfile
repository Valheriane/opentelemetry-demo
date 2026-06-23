FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY src/product-reviews-dgs/package*.json ./
RUN npm install

COPY src/product-reviews-dgs/tsconfig.json ./
COPY src/product-reviews-dgs/src ./src

RUN npm run build

FROM node:22-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY src/product-reviews-dgs/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 4009

CMD ["node", "dist/index.js"]
