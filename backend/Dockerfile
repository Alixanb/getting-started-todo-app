###################################################
# Backend image — Node.js todo-items API.
#
# Build context: ./backend
#   - dev   : nodemon dev server
#   - test  : runs the Jest suite (gates the final image)
#   - final : production image (no dev deps, no tests)
###################################################

###################################################
# Stage: base — shared install layer
###################################################
FROM node:22 AS base
WORKDIR /usr/local/app
COPY package.json package-lock.json ./

###################################################
# Stage: dev — nodemon dev server (used by compose)
###################################################
FROM base AS dev
RUN npm install
COPY jest.config.js ./jest.config.js
COPY spec ./spec
COPY src ./src
EXPOSE 3000
CMD ["npm", "run", "dev"]

###################################################
# Stage: test — runs the test suite
#
# Split into its own stage so the final image carries neither the test
# dependencies nor the test cases. `final` depends on it, so the build fails
# if the tests fail.
###################################################
FROM dev AS test
RUN npm run test

###################################################
# Stage: final — production image
###################################################
FROM base AS final
ENV NODE_ENV=production
# Pull package files from the test stage so the tests must run before we build.
COPY --from=test /usr/local/app/package.json /usr/local/app/package-lock.json ./
RUN npm ci --production && \
    npm cache clean --force
COPY src ./src
EXPOSE 3000
CMD ["node", "src/index.js"]
