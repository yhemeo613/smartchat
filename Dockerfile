FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

EXPOSE 8889

ENV NODE_ENV=production
ENV PORT=8889

CMD ["pnpm", "start"]
