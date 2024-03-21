# docs.audius.org

## Dev

```
npm install
npm run prepare:translations
npm start
```

To develop on cloudflare pages and test the whole stack, run:

```
npm run pages:dev
```

## Build

```
npm run build
```

## Publish

Running the following commands will create a public test site to view your changes.

To deploy to docs.audius.org, ensure the commands are run from the `main` branch.

```
npm run build
npm run pages:deploy
```

## Translate

```
npm run prepare:translations
```

This will write translations to the i18n folder.
If you modify markdown files while running the local dev server, you will need to prepare the translations as /i18n/en is the default entrypoint.
