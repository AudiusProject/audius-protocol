# Audius DDEX

React app for managing Audius DDEX uploads.

* To test locally: `npm run stage` or `npm run prod`  
* To test in a more prod-like manner locally: `npm run stage:preview` or `npm run prod:preview`  
* When ran on stage or prod, the app will query its local `/d_api/env`` endpoint to get environment variables that are set on the node (because the React app can't access these directly for security reasons)
