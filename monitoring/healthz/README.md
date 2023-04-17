# To run locally

```
nvm use

npm i
npm run dev
```

# To deploy

Ensure you have cloudflare access.
You will also need node v16.13.0.
If you don't have it:

```
nvm install 16.13.0
nvm use 16.13.0
```

Deploy with:

```
npm run deploy
```

Note: when it asks `Would you like to help improve Wrangler by sending usage metrics to Cloudflare? (y/n)` either yes or no is fine.
