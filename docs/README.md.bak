# docs.audius.org

## Dependencies

Install dependencies, run:

```sh
npm install
```

---

## Development Server

To run the docs locally, run:

```sh
npm run start
```

To develop on Cloudflare pages and test the whole stack, run:

```sh
npm run pages:dev
```

---

## Generate REST API docs

### Configure

Open `docusaurus.config.js` and find the `config:plugins:docusaurus-plugin-openapi-docs:config`
section values.

Edit the commented fields to suit your needs

```js
config: {
 api: {
   specPath: 'docs/developers/swagger.json', // path or URL to the OpenAPI spec, this one downloaded from 'https://discoveryprovider.audius.co/v1/swagger.json'
   // specPath: 'https://discoveryprovider.audius.co/v1/swagger.json', // path or URL to the OpenAPI spec
   outputDir: 'docs/developers/api', // output directory for generated *.mdx and sidebar.js files
   sidebarOptions: {
     groupPathsBy: 'tag', // generate a sidebar.js slice that groups operations by tag
   },
 },
},
```

> [!NOTE]
>
> Currently, you will need to update the `basePath` value to
> `https://discoveryprovider.audius.co/v1` instead of the default `"basePath": "/v1"`

### First Time Run

from the root `docs` directory, run:

```sh
npm run-script docusaurus gen-api-docs all
```

Copy the contents of `apisidebar` found in the generated `<OUTPUTDIR>/sidebar.ts` file to the root
level `/sidebars.js`

> More info is available at the
> [plugin repo](https://github.com/PaloAltoNetworks/docusaurus-openapi-docs)

---

## Build

```sh
npm run build
```

---

## Publish

Running the following commands will create a public test site to view your changes.

To deploy to docs.audius.org, ensure the commands are run from the `main` branch.

```sh
npm run build
npm run pages:deploy
```
