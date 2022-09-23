const fs = require('fs-extra')
const path = require('path')
const os = require('os')

const AudiusToken = artifacts.require('AudiusToken')

const AudiusIdentityService = 'identity-service'
const AudiusContentNode = 'content-node'
const AudiusEthContracts = 'eth-contracts'
const AudiusDiscoveryNode = 'discovery-node'

const Libs = 'libs'

/**  dirName is directory name of the audius repo that you're trying to get the path to */
const getDirectoryRoot = (dirName) => {
  const dir = path.join(__dirname, '../../')
  const traversePath = path.join(dir, dirName)

  if (!fs.existsSync(traversePath)) {
    throw new Error(`Couldn't find expected path ${traversePath}`)
  }
  return traversePath
}

/** Copies the contents of build/contracts to the outputDirPath */
const copyBuildDirectory = async (outputDirPath) => {
  const dir = path.join(__dirname, '..')
  const localTarget = path.join(dir, 'build/contracts')

  await createDir(outputDirPath)

  // clean up unnecessary metadata and copy ABI
  const files = fs.readdirSync(localTarget)
  files.forEach(function (file, index) {
    const filePath = path.join(localTarget, file)
    const fileObj = require(filePath)
    const newAbi = {
      contractName: fileObj.contractName,
      abi: fileObj.abi
    }
    fs.writeFileSync(
      path.join(outputDirPath, file),
      JSON.stringify(newAbi, null, 2),
      'utf-8'
    )
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

/**
 * Create config file in outputFilePath
 * config file contains deployed AudiusToken and Registry contract addresses, and ownerWallet
 */
const outputJsonConfigFile = async (outputFilePath) => {
  try {
    let migrationOutputPath = path.join(getDirectoryRoot(AudiusEthContracts), 'migrations', 'migration-output.json')
    if (!fs.existsSync(migrationOutputPath)) {
      console.log('Failed to find migration output')
      throw new Error('Failed to find migration output')
    }
    const addressInfo = require(migrationOutputPath)
    let outputDictionary = {}
    outputDictionary['audiusTokenAddress'] = addressInfo.tokenAddress
    outputDictionary['registryAddress'] = addressInfo.registryAddress
    outputDictionary['ownerWallet'] = addressInfo.proxyDeployerAddress
    outputDictionary['allWallets'] = await web3.eth.getAccounts()
    fs.writeFile(outputFilePath, JSON.stringify(outputDictionary), (err) => {
      if (err != null) {
        console.log(err)
      }
    })
  } catch (e) {
    console.log(e)
  }
}

/**
 * output all relevant contract addresses to file for external consumption
 */
 const outputFlaskConfigFile = async (outputPath) => {
  try {
    // Pull registry address from config because artifacts will require the updated
    // version after a migration resuses the registry
    let migrationOutputPath = path.join(getDirectoryRoot(AudiusEthContracts), 'migrations', 'migration-output.json')
    if (!fs.existsSync(migrationOutputPath)) {
      console.log('Failed to find migration output')
      throw new Error('Failed to find migration output')
    }
    const addressInfo = require(migrationOutputPath)

    let configFileContents = '[eth_contracts]\n'
    configFileContents += 'registry = ' + addressInfo.registryAddress + '\n'

    configFileContents += '\n'

    let outputFlaskConfigFile = outputPath
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

/** Replace eth-contracts artifacts in libs with new ABIs and config */
module.exports = async callback => {
  // output to Libs
  try {
    const libsDirRoot = path.join(getDirectoryRoot(Libs), 'src/eth-contracts')
    fs.removeSync(libsDirRoot)
  
    await copyBuildDirectory(path.join(libsDirRoot, '/ABIs'))
    await outputJsonConfigFile(path.join(libsDirRoot, '/config.json'))
  } catch (e) {
    console.log("Libs doesn't exist", e)
  }

  // output to Identity Service
  try {
    await outputJsonConfigFile(path.join(getDirectoryRoot(AudiusIdentityService), '/eth-contract-config.json'))
  } catch (e) {
    console.log("Identity service doesn't exist", e)
  }

  // output to Content Node
  try {
    await outputJsonConfigFile(path.join(getDirectoryRoot(AudiusContentNode), '/eth-contract-config.json'))
  } catch (e) {
    console.log("Content node doesn't exist", e)
  }

  // output to Discovery Node
  try {
    const discProvOutputPath = path.join(getDirectoryRoot(AudiusDiscoveryNode), 'build', 'eth-contracts')

    // Copy build directory
    await copyBuildDirectory(discProvOutputPath)

    const flaskConfigPath = path.join(
      getDirectoryRoot(AudiusDiscoveryNode),
      'eth_contract_config.ini'
    )
    // Write updated flask config file
    outputFlaskConfigFile(flaskConfigPath)
  } catch (e) {
    console.log("Discovery node doesn't exist", e)
  }

  const dappOutput = path.join(os.homedir(), '/.audius')
  if (!fs.existsSync(dappOutput)) {
    fs.mkdirSync(dappOutput, { recursive: true })
  }
  await outputJsonConfigFile(path.join(dappOutput, '/eth-config.json'))
}
