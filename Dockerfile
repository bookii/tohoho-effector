FROM node:24.7.0-alpine3.21 AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

FROM base AS builder
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /app/package.json /app/pnpm-lock.yaml* ./
COPY --from=builder --chown=node:node /app/build ./build
RUN pnpm install --prod --frozen-lockfile
EXPOSE 3000
USER node
CMD ["node", "build"]