---
'@audius/sdk': patch
---

Load `tus-js-client` and the Node `file-type` path only when an upload or file type check needs them, and fetch the storage node list on first use instead of when the SDK is created.
