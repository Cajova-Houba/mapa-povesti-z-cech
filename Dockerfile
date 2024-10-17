FROM node:20.18.0-alpine3.20 AS build

RUN mkdir -p /opt/build
WORKDIR /opt/build
COPY . .

RUN npm install
RUN npm run build-prod

FROM docker.io/busybox:1.36-uclibc

# Create a non-root user to own the files and run our server
RUN adduser -D static
USER static
WORKDIR /home/static

# Copy the static website
COPY --from=build /opt/build/dist/ .

# Run BusyBox httpd
CMD ["busybox", "httpd", "-f", "-v", "-p", "3000"]