const config = require('./config')

// AWS SNS init
const AWS = require('aws-sdk')
const sns = new AWS.SNS({
  accessKeyId: config.get('awsAccessKeyId'),
  secretAccessKey: config.get('awsSecretAccessKey'),
  region: 'us-west-1'
})

// the aws sdk doesn't like when you set the function equal to a variable and try to call it
// eg. const func = sns.<functionname>; func() returns an error, so util.promisify doesn't work
function _promisifySNS (functionName) {
  return function (...args) {
    return new Promise(function (resolve, reject) {
      sns[functionName](...args, function (err, data) {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }
}

const listEndpointsByPlatformApplication = _promisifySNS('listEndpointsByPlatformApplication')
const createPlatformEndpoint = _promisifySNS('createPlatformEndpoint')

module.exports = {
  listEndpointsByPlatformApplication,
  createPlatformEndpoint
}
