# API Client Generator

Generates a typed client of the Audius read-only API using a running discovery node.

## Prerequisites

This repository uses `@openapitools/openapi-generator-cli` which requires Java 8 runtime (JRE) to be installed.

Linux:

```bash
sudo apt install default-jre
```

## Generating Types

Commands are in the form:

```bash
npm run gen:{env}:{flavor?}
```

### Options

- `env` choices=("dev", "stage", "prod"): Which environment to choose the Discovery Provider to generate from
  - `dev`: http://dn1_web-server_1:5000/
  - `stage`: https://discoveryprovider.staging.audius.co/
  - `prod`: https://discoveryprovider.audius.co
- `flavor` [optional] choices=("default", "full"): Which flavor of the API to generate types for
  - undefined for both
  - `default` for /v1
  - `full` for /v1/full

```bash
#### DEVELOPMENT ####
npm run gen:dev
npm run gen:dev:default
npm run gen:dev:full

#### STAGING ####
npm run gen:stage
npm run gen:stage:default
npm run gen:stage:full

#### PROD ####
npm run gen:prod
npm run gen:prod:default
npm run gen:prod:full
```
