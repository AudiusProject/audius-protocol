![Prober](https://user-images.githubusercontent.com/2731362/61009053-44363a00-a326-11e9-8bde-c16901b9932b.png 'Prober')

# Probers

Probers is a set of integration tests for the audius dapp using a headless browser.

## Usage

Note: that tests run by default against port 3001 (see [src/config.js](src/config.js)) so you should have [audius-web-client](https://github.com/AudiusProject/audius-client/packages/web) up and running on that port before attempting to run `probers` tests.

To run all the tests:

```
npm run cypress:run
```

To run all tests and view the progress in a browser:

```
npm run cypress:open
```

To run a against staging

```
npm run cypress:run-stage
npm run cypress:open-stage
```

**IMPORTANT: Probers by default will make accounts. Don't do this against prod.**
