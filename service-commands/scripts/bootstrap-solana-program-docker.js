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
  // Do some setup...
  execSync(`rm -rf ${tmp}`, { stdio: 'inherit' })
  execSync(`mkdir -p ${tmp}`, { stdio: 'inherit' })

  // Spin up the solana validator from a blank state
  // NOTE: The validator must be run locally and NOT in a docker container
  // If run in docker, the cache cannot be copied after ~300 slots
  const solanaValidator = exec(`cd ${tmp} && solana-test-validator`)

  // Compile all the solana programs and deploy to the validator
  execSync(
    `cd ${solanaProgramsPath} && docker run --name audius_solana_programs --network host -e SOLANA_HOST='http://127.0.0.1:8899' -v "$PWD:/usr/src/app" audius/solana-programs:develop2 > solana-program-config.json`,
    { stdio: 'inherit' }
  )

  // Copy the solana-program-config.json to the tmp folder
  execSync(`cp ${solanaProgramsPath}/solana-program-config.json ${tmp}`, {
    stdio: 'inherit'
  })

  solanaValidator.kill()

  // Compile all the solana programs and deploy to the validator
  let solanaConfig = fs.readFileSync(`${tmp}/solana-program-config.json`)
  solanaConfig = JSON.parse(solanaConfig)
  solanaConfig.endpoint = 'http://solana:8899'
  fs.writeFileSync(
    `${tmp}/solana-program-config.json`,
    JSON.stringify(solanaConfig, null, ' ')
  )

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
  execSync(
    'docker kill audius_solana_programs && docker rm audius_solana_programs',
    { stdio: 'inherit' }
  )

  // TODO: Deploy to docker registry (dockerhub)
  console.log('Be sure to publish the docker file if using externally')
  console.log('ie. "docker push audius/solana-programs:predeployed-latest"')
}

main()
