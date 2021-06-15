/* eslint-disable */
// TODO - rename this script, remove ownerWallet export?, either make the name of the output
// file consistent or if monorepo, export the file to a location accessible by all repos

/*
 * INTENDED FOR TESTING PURPOSES ONLY
 * Copies contents of build/ to other audius repositories
 * Uses deployed contracts and performs operations on deployed contracts within ganache
 * instance
 * */

const fs = require('fs-extra')
const path = require('path')
const os = require('os');

const Registry = artifacts.require('Registry')
const truffle_dev_config = artifacts.options['_values']['networks']['development']

const AudiusLibs = 'libs'
const AudiusSharedLibs = 'audius-shared-libs'
const AudiusDiscoveryProvider = 'discovery-provider'
const AudiusIdentityService = 'identity-service'
const AudiusCreatorNode = 'creator-node'

let registry


const getDefaultAccount = async () => {
  let accounts = await web3.eth.getAccounts()
  return accounts[0]
}

// dirName is directory name of the audius repo that you're trying to get the path to
const getDirectoryRoot = (dirName) => {
  let dir = path.join(__dirname, '../../')
  let traversePath = path.join(dir, dirName)

  if (!fs.existsSync(traversePath)) {
    throw new Error(`Couldn't find expected path ${traversePath}`)
  }
  return traversePath
}

/** Print expected usage */
const printUsageAndThrow = () => {
  console.log('\nIncorrect usage. Please use the following format:')
  console.log('truffle exec _contractsLocalSetup.js -run')
  console.log('')
  throw new Error('Incorrect usage')
}

/** Copies the contents of build/contracts to the outputPath */
const copyBuildDirectory = async (outputPath) => {
  let dir = path.join(__dirname, '..')
  let localTarget = path.join(dir, 'build/contracts')

  await createDir(outputPath)

  // clean up unnecessary metadata and copy ABI
  let files = fs.readdirSync(localTarget)
  files.forEach(function (file, index) {
    let filePath = path.join(localTarget, file)
    let fileObj = require(filePath)
    let newAbi = {
      contractName: fileObj.contractName,
      abi: fileObj.abi
    }
    fs.writeFileSync(path.join(outputPath, file), JSON.stringify(newAbi, null, 2), 'utf-8')
  })
}

/** Creates directory if path does not exist */
async function createDir (dir) {
  try {
    await fs.ensureDir(dir)
  } catch (err) {
    console.log(`Error with creating folder at path ${dir}: ${err}`)
  }
}

/** Copy the contents of signature_schemas to the given path */
const copySignatureSchemas = (outputPath) => {
  const sourcePath = __dirname + '/../signature_schemas/signatureSchemas.js'
  fs.copySync(sourcePath, outputPath)
}

const outputJsonConfigFile = async (outputPath) => {
  try{
    registry = await Registry.deployed()
    let outputDictionary = {}
    outputDictionary['registryAddress'] = registry.address
    outputDictionary['ownerWallet'] = await getDefaultAccount()
    outputDictionary['allWallets'] = await web3.eth.getAccounts()

    fs.writeFile(outputPath, JSON.stringify(outputDictionary), (err)=>{
      if(err != null){
        console.log(err)
      }
    })
    console.log(`contracts JSON Config written to ${outputPath}`)
  }
  catch (e) {
    console.log(e)
  }
}

/**
 * output all relevant contract addresses to file for external consumption
 */
const outputFlaskConfigFile = async (outputPath) => {
  try {
    registry = await Registry.deployed()

    let configFileContents = '[contracts]\n'
    configFileContents += 'registry = ' + registry.address + '\n'

    configFileContents += '\n'

    let outputFlaskConfigFile = outputPath
    console.log(outputFlaskConfigFile)
    console.log(`Target Output Flask Config File: ${outputFlaskConfigFile}`)
    console.log(`Contents: \n ${configFileContents}`)

    fs.writeFile(outputFlaskConfigFile, configFileContents, err => {
      // throws an error, you could also catch it here
      if (err) throw err

      // success case, the file was saved
      console.log(`Environment file written: ${outputFlaskConfigFile}`)
    })
  } catch (e) {
    console.log(e)
  }
}


module.exports = async callback => {
  // Populate deployed ganache instance with various objects
  // Used to test components that require content
  if (process.argv.length < 5) {
    printUsageAndThrow()
  }

  if (process.argv[4] === '-run'){
    try {
      let discProvOutputPath = path.join(getDirectoryRoot(AudiusDiscoveryProvider), 'build', 'contracts')

      // Copy build directory
      await copyBuildDirectory(discProvOutputPath)

      let flaskConfigPath = path.join(
        getDirectoryRoot(AudiusDiscoveryProvider),
        'contract_config.ini'
      )
      console.log(flaskConfigPath)
      // Write updated flask config file
      outputFlaskConfigFile(flaskConfigPath)
    } catch (e) {
      console.log(e)
    }
  }
  else if (process.argv[4] === '-run-shared-lib'){
    let defaultDiscprovEndpoint = 'http://localhost:5000'
    let sharedLibOutputPath = path.join(getDirectoryRoot(AudiusSharedLibs), 'contract_abi')
    await copyBuildDirectory(sharedLibOutputPath)
    let sharedLibSignatureSchemaOutputPath = path.join(getDirectoryRoot(AudiusSharedLibs), 'signature_schemas')
    copySignatureSchemas(sharedLibSignatureSchemaOutputPath)

    // Uncomment if necessary
    outputJsonConfigFile(getDirectoryRoot(AudiusSharedLibs) + '/config.json')
    try {
      outputJsonConfigFile(getDirectoryRoot(AudiusIdentityService) + '/contract-config.json')
    }
    catch(e){
      console.log("Identity service doesn't exist, probably running via E2E setup scripts")
    }

    // special case for ~/.audius/config.json used by front end
    const dappOutput = os.homedir() + '/.audius'
    if (!fs.existsSync(dappOutput)) {
      fs.mkdirSync(dappOutput, { recursive: true })
    }
    outputJsonConfigFile(dappOutput + '/config.json')
  }
  /** Replace contracts artifacts in libs with new ABIs, signature schemas and config */
  else if (process.argv[4] === '-run-audlib'){
    const libsDirRoot = path.join(getDirectoryRoot(AudiusLibs), 'data-contracts')
    fs.removeSync(libsDirRoot)

    await copyBuildDirectory(path.join(libsDirRoot, '/ABIs'))
    copySignatureSchemas(path.join(libsDirRoot, '/signatureSchemas.js'))
    outputJsonConfigFile(path.join(libsDirRoot, '/config.json'))

    // output to Identity Service
    try {
      outputJsonConfigFile(getDirectoryRoot(AudiusIdentityService) + '/contract-config.json')
    }
    catch(e){
      console.log("Identity service doesn't exist, probably running via E2E setup scripts")
    }

    // output to Creator Node
    try {
      outputJsonConfigFile(getDirectoryRoot(AudiusCreatorNode) + '/contract-config.json')
    } catch (e) {
      console.log("Creator node dir doesn't exist, probably running via E2E setup scripts")
    }

    // special case for ~/.audius/config.json used by front end
    const dappOutput = os.homedir() + '/.audius'
    if (!fs.existsSync(dappOutput)) {
      fs.mkdirSync(dappOutput, { recursive: true })
    }
    outputJsonConfigFile(dappOutput + '/config.json')
  }
  else{
    printUsageAndThrow()
  }

  console.log('end')
}
