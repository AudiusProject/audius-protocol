# Mediorum

stores files and stuff

## Status + Run it

* `make tools` - install tools (make sure `~/go/bin` is in path)
* `make pg.bounce` - starts postgres via docker-compose
* `make` - starts single process dev cluster

* `make test`

visit `http://localhost:1991/`

with `make dev2` you can use `goreman` to start and stop servers:

* `make dev2` - starts servers as separate processes
* `goreman run stop m2`
* `goreman run start m2`

## Docker

```
docker build . -t mediorum
docker run -it -p 1991:1991 mediorum
```

## Deploy

* `make build.fast`
