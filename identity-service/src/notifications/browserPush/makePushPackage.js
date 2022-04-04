const fs = require('fs')
const path = require('path')
const pushLib = require('safari-push-notifications')

// Common between all env
const intermediate = fs.readFileSync(path.join(__dirname, './audius.pushpackage/AppleWWDRCA.pem'))

// Differing env

// Locally
// NOTE: safari requires https, so ngrok is used for local development and must be replaced here
// const devConfig = {
//   websiteName: 'Audius',
//   websitePushID: 'web.co.audius.staging',
//   appUrl: 'http://localhost:3000',
//   identityUrl: 'https://0ef6caf4.ngrok.io', // Replace with https ngrok link
//   appUrls: [],
//   cert: fs.readFileSync(path.join(__dirname, '/audius.pushpackage/stagingCert.pem')),
//   key: fs.readFileSync(path.join(__dirname, '/audius.pushpackage/stagingKey.pem')),
//   output: 'devPushPackage.zip'
// }

// Staging
// const stagingConfig = {
//   websiteName: 'Audius',
//   websitePushID: 'web.co.audius.staging',
//   appUrl: 'https://staging.audius.co',
//   identityUrl: 'https://identityservice.staging.audius.co',
//   appUrls: ['https://joey.audius.co', 'https://ray.audius.co', 'https://michael.audius.co', 'https://forrest.audius.co'],
//   cert: fs.readFileSync(path.join(__dirname, '/audius.pushpackage/stagingCert.pem')),
//   key: fs.readFileSync(path.join(__dirname, '/audius.pushpackage/stagingKey.pem')),
//   output: 'stagingPushPackage.zip'
// }

const prodConfig = {
  websiteName: 'Audius',
  websitePushID: 'web.co.audius',
  appUrl: 'https://audius.co',
  identityUrl: 'https://identityservice.audius.co',
  appUrls: [],
  cert: fs.readFileSync(path.join(__dirname, './audius.pushpackage/prodCert.pem')),
  key: fs.readFileSync(path.join(__dirname, './audius.pushpackage/prodKey.pem')),
  output: 'productionPushPackage.zip'
}

// Change the config to be local / staging / prod
let config = prodConfig

const websiteJson = pushLib.websiteJSON(
  config.websiteName,
  config.websitePushID,
  [config.appUrl, config.identityUrl, ...config.appUrls], // allowedDomains
  `${config.appUrl}/feed?openNotifications=true`, // urlFormatString
  1000000000000000, // authenticationToken (zeroFilled to fit 16 chars)
  `${config.identityUrl}/push_notifications/safari` // webServiceURL (Must be https!)
)

pushLib.generatePackage(
  websiteJson, // The object from before / your own website.json object
  path.join(__dirname, '/audius.pushpackage/icon.iconsets'), // Folder containing the iconset
  config.cert, // Certificate
  config.key, // Private Key
  intermediate // Intermediate certificate
)
  .pipe(fs.createWriteStream(config.output))
  .on('finish', function () {
    console.log('pushPackage.zip is ready.')
  })
