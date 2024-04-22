# docs.audius.org

## Dev

```sh
npm install
npm run prepare:translations
npm start
```

To develop on cloudflare pages and test the whole stack, run:

```sh
npm run pages:dev
```

## Build

```sh
npm run build
```

## Publish

Running the following commands will create a public test site to view your changes.

To deploy to docs.audius.org, ensure the commands are run from the `main` branch.

```sh
npm run build
npm run pages:deploy
```

## Translate

```sh
npm run prepare:translations
```

This will write translations to the i18n folder. If you modify markdown files while running the
local dev server, you will need to prepare the translations as /i18n/en is the default entrypoint.
