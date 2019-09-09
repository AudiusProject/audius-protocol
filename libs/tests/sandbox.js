const axios = require('axios')
const urlJoin = require('proper-url-join')
const semver = require('semver')
const assert = require('assert')
const helpers = require('./helpers')

const serviceTypeList = ['discovery-provider', 'creator-node', 'content-service']
const latestVersionStr = '0.0.1'

const audius0 = helpers.audiusInstance

let ownerWallet
let accounts

before(async function () {
  await audius0.init()
  ownerWallet = audius0.ethWeb3Manager.getWalletAddress()
  accounts = await audius0.ethWeb3Manager.getWeb3().eth.getAccounts()
})

it('parse version endpoint', async function () {
  let spType = 'discovery-provider'
  let discoveryProviders =
    await audius0.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(spType)
  /*
  let numberOfServiceVersions =
    await audius0.ethContracts.VersioningFactoryClient.getNumberOfVersions(spType)
    */
  let selectedDiscProv = await audius0.ethContracts.selectDiscoveryProvider()
  console.log(selectedDiscProv)
  return
  for (const discProv of discoveryProviders) {
    console.log(discProv)
    let endpt = discProv.endpoint
    let requestUrl = urlJoin(endpt, 'version')
    console.log(requestUrl)
    const axiosRequest = {
      url: requestUrl,
      method: 'get',
      timeout: 1000
    }
    let response = await axios(axiosRequest)
    console.log(response.data)
    let version = response.data.version
    console.log(version)
    console.log(semver.valid(version))
    let minorV = semver.minor(version)
    console.log(minorV)
  }

  // let endpoint = 'http://localhost:5000'
})
