# Safari Browser Push Notifications
For the guidelines on setting it up check out the [apple docs](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/NotificationProgrammingGuideForWebsites/PushNotifications/PushNotifications.html#//apple_ref/doc/uid/TP40013225-CH3-SW1)


The `makePushPackage.js` script is used to generate the push package. 
If developing locally, you must use https, so replace the server url w/ a secure ngrok link 
and regenerate the package.

## Generating the certs / keys

### Generating the cert.pem
Run: `openssl x509 -in <path-to-website_aps_production.cer> -inform DER -outform PEM -out cert.pem`

### Generating the key.pem
Run `openssl pkcs12 -in <path-to-audiusweb.p12> -out key.pem -nodes`

### Convert the Apple WWDRCA.cer to a .pem
Run `openssl x509 -inform der -in <cer-file>AppleWWDRCA.cer -out AppleWWDRCA.pem`