###################################################
# Frontend image — React/Vite SPA served by nginx.
#
# Build context: ./client
#   - dev   : Vite dev server (hot reload) for docker compose
#   - build : produces the static bundle in /usr/local/app/dist
#   - final : nginx serving that bundle (production image)
###################################################

###################################################
# Stage: base — shared install layer
###################################################
FROM node:22 AS base
WORKDIR /usr/local/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

###################################################
# Stage: dev — Vite dev server (used by compose)
###################################################
FROM base AS dev
EXPOSE 5173
CMD ["npm", "run", "dev"]

###################################################
# Stage: build — static production bundle
###################################################
FROM base AS build
RUN npm run build

###################################################
# Stage: final — nginx serving the SPA
###################################################
FROM nginx:alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/local/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
