# Stage 1: Build the React app
FROM node:18-alpine as react-builder

# The bufferutil package needs python
RUN apk add --no-cache python3 make g++ 

ENV UPTIME_BASE_URL="/d/"
WORKDIR /app
COPY node-ui/package.json node-ui/package-lock.json ./node-ui/
RUN npm install --prefix node-ui

COPY node-ui/ ./node-ui/
RUN npm run build --prefix node-ui

# Stage 2: Build the Go binary
FROM golang:1.21.4-alpine AS go-builder

WORKDIR /app

# Cache deps before copying source and building
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /uptime

# Stage 3: Copy the binary and static assets to a minimal final image
FROM alpine:3.18.4 AS final
RUN apk add --no-cache curl
COPY --from=go-builder /uptime /bin/uptime
COPY --from=react-builder /app/node-ui/dist /app/node-ui/dist

ENTRYPOINT ["/bin/uptime"]
