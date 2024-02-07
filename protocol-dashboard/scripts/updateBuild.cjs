const fs = require('fs')
const pinataSDK = require('@pinata/sdk')

const pinata = pinataSDK(process.env.PINATA_KEY_NAME, process.env.PINATA_KEY_SECRET)

const args = process.argv
console.log(process.argv)
if (args.length < 3) {
  console.error('Need to provide environment <dev|stage|prod>')
  process.exit(1)
} else if (args.length > 3) {
  console.warn('Extra arg provided')
}

const env = args[2]
if (env !== 'dev' && env !== 'stage' && env !== 'prod') {
  console.error('Environment must be <dev|stage|prod>')
  process.exit(1)
}

const pinFromFs = async () => {
  const options = {
    pinataMetadata: {
      name: `Dashboard build ${env} - ${new Date().toISOString()}`
    }
  }
  const sourcePath = '/home/circleci/audius-protocol/protocol-dashboard/dist'
  try {
    const result = await pinata.pinFromFS(sourcePath, options)
    console.log(result)
    return result
  } catch (e) {
    console.log(e)
  }
}

const run = async () => {
  try {
    const { IpfsHash } = await pinFromFs()
    fs.writeFileSync(`./build_cid.txt`, IpfsHash)
    process.exit()
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

run()
