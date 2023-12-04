# Pedalboard

Pedalboard is a collection of packages and plugins meant to run alongside a discovery indexer and database. They're meant to operate in isolation but stack together to expose various combinations of functionality to the network.

```
npm install turbo --global
npm install
```

# Project Structure

There are two main directories where work is done. [Packages](./packages) and [Apps](./apps). Packages are modules and libraries that are useful across various plugins. Apps are code that gets compiled and run against the database and indexer.

# Starting a new application

To create a new application copy and paste the [app-template](./apps/app-template/). Rename your directory and package json project name to what you'd like and you should be ready to start developing. The application template will have an example app for you to get started with.

At this time of writing this is what it looks like:

```
import { log } from "@pedalboard/logger";
import App from "@pedalboard/basekit/src/app";
import moment from "moment";

type SharedData = {};

const main = async () => {
  await new App<SharedData>({})
    .tick({ seconds: 5 }, async (_app) => {
      console.log(`tick ${moment().calendar()}`)
    })
    .run();
};

(async () => {
  await main().catch(log);
})();
```

# Starting a new package

Packages you can start a new project with a standard NPM init or copy one of the existing packages as well. You can follow the same process as app. Lastly, after initializing your project you have to install it to the workspace so other apps and packages can access it.

In the case of the storage project this is how you'd do it from the workspace root:

```
npm i ./packages/storage
```

# Building and running apps in isolation

Inside `/dev-tools/compose` is a [docker compose for pedalboard](../../../../dev-tools/compose/docker-compose.pedalboard.dev.yml) file that houses all of the applications. Building and running your new application alongside the other is as simple as following the `app-template` example.

1. Add your new service by copying what the `app-template` does.

```
  my-cool-plugin:
    container_name: my-cool-plugin
    build:
      context: .
      dockerfile: ./docker/Dockerfile
      args:
        app_name: my-cool-plugin
    restart: always
```

2. Run the docker file with the build flag

```
docker compose up --build -d
```

3. In docker dashboard or `docker ps` you should find your running container

```
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

NAMES                        IMAGE                                    STATUS
trending-challenge-rewards   pedalboard-trending-challenge-rewards    Up 21 minutes
app-template                 pedalboard-app-template                  Up 21 minutes
```

# Tools

Turborepo

Docker

Typescript

Npm
