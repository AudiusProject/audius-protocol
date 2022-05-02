const fs = require('fs')
const { exec, execSync } = require('child_process')

const solanaProgramsPath = `${process.env.PROTOCOL_DIR}/solana-programs`
const tmp = `/tmp/solana-deploy`

const getGitHash = async () => {
  const gitHash = await new Promise(resolve =>
    exec(`cd ${solanaProgramsPath} && git rev-parse HEAD`, (_, stdout) =>
      resolve(stdout.trim())
    )
  )
  return gitHash
}

const writeMetadata = async ({ gitHash }) => {
  fs.writeFileSync(
    `${tmp}/metadata.json`,
    JSON.stringify(
      {
        gitHash,
        date: new Date().toISOString()
      },
      null,
      ' '
    )
  )
}

const main = async () => {
  // Spin up the solana validator from a blank state
  execSync('A run solana-validator up', { stdio: 'inherit' })
  // Compile all the solana programs and deploy to the validator
  execSync('A run solana-programs up', { stdio: 'inherit' })

  // Do some setup...
  execSync(`rm -rf ${tmp}`, { stdio: 'inherit' })
  execSync(`mkdir -p ${tmp}`, { stdio: 'inherit' })

  // wait for memory to be written to disk
  await new Promise(resolve => setTimeout(resolve, 1000 * 60))

  // Copy the 'test-ledger' directory with all the information on chain to a local tmp folder
  execSync(`docker cp solana:/test-ledger ${tmp}`, { stdio: 'inherit' })

  // Copy the solana configs to the tmp folder
  execSync(`cp ${solanaProgramsPath}/solana-program-config.json ${tmp}`, {
    stdio: 'inherit'
  })
  // Copy the Dockerfile to the tmp folder
  execSync(`cp ${solanaProgramsPath}/Dockerfile.cacheLedger ${tmp}`, {
    stdio: 'inherit'
  })

  // Copy all JSON files tmp folder: solana config, admin account keypair, admin authority keypair, user keypair
  execSync(`cp ${solanaProgramsPath}/anchor/audius-data/*.json ${tmp}`, {
    stdio: 'inherit'
  })

  execSync(`mkdir -p ${tmp}/audius-data`, { stdio: 'inherit' })
  execSync(
    `cp -r ${solanaProgramsPath}/anchor/audius-data/target ${tmp}/audius-data`,
    { stdio: 'inherit' }
  )

  const gitHash = await getGitHash()
  await writeMetadata({ gitHash })

  // Make the dockerfile
  execSync(
    `cd ${tmp} && docker build -f Dockerfile.cacheLedger -t audius/solana-programs:predeployed-latest .`,
    { stdio: 'inherit' }
  )
  execSync(
    `docker tag audius/solana-programs:predeployed-latest audius/solana-programs:predeployed-${gitHash}`,
    { stdio: 'inherit' }
  )
  execSync('docker kill solana && docker rm solana', { stdio: 'inherit' })

  // TODO: Deploy to docker registry (dockerhub)
  console.log('Be sure to publish the docker file if using externally')
  console.log('ie. "docker push audius/solana-programs:predeployed-latest"')
}

main()
