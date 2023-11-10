# Node UI

React app exposing uptime of nodes in the network.

To test locally: `npm run stage` or `npm run prod`.  
When ran on stage or prod, the app will query its local /up_api/env endpoint to get environment variables that are set on the node (because the React app can't access these directly for security reasons).
