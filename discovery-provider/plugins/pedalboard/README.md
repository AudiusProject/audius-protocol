# Pedalboard 🎸

Pedalboard is a plugin framework for Discovery nodes! It aims to provide the developer with a set of tools and utilities so they can spend less time worrying about setup and scalability and more about cool features. 

# Tools

Pedalboard uses a number of tools to make life easy.

typescript: typed js

knex-types: a typescript codegen tool to make working with db entities painless

knex: query builder for ts and js

…

more as pedalboard gets built out

# Running against remote DBs

open an ssh tunnel in a terminal and hold it open
```
ssh -L 5432:localhost:5432 ubuntu@{EXTERNAL_IP_OF_MACHINE}
```
in another terminal run a `new App()` or `scripts/sandbox.ts` while connecting to `postgresql://postgres:postgres@localhost:5432/audius_discovery`
