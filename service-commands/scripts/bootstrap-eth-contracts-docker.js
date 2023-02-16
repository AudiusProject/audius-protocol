const fs = require('fs')
const { exec, execSync } = require('child_process')

const tmpDataContracts = `/tmp/data-contracts`
const tmpEthContracts = `/tmp/eth-contracts`

const getGitHash = async () => {
  const gitHash = await new Promise(resolve =>
    exec(`cd ${process.env.PROTOCOL_DIR} && git rev-parse HEAD`, (_, stdout) =>
      resolve(stdout.trim())
    )
  )
  return gitHash
}

const writeMetadata = async ({ gitHash, path }) => {
  fs.writeFileSync(
    `${path}/metadata.json`,
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
  execSync(`rm -rf ${tmpDataContracts}`, { stdio: 'inherit' })
  execSync(`mkdir -p ${tmpDataContracts}`, { stdio: 'inherit' })
  execSync(`rm -rf ${tmpEthContracts}`, { stdio: 'inherit' })
  execSync(`mkdir -p ${tmpEthContracts}`, { stdio: 'inherit' })

  // ========== Run ganache and migrate contracts  ==========
  execSync('A run contracts up', { stdio: 'inherit' })
  execSync('A run eth-contracts up', { stdio: 'inherit' })
  execSync('A run init-contracts-info up', { stdio: 'inherit' })
  execSync('A run init-token-versions up', { stdio: 'inherit' })
  execSync('A run aao register', { stdio: 'inherit' })

  // ========== Copy the ledger & build artifacts for eth ==========
  execSync(
    `docker cp audius_ganache_cli_eth_contracts:/app/db ${tmpEthContracts}/db`,
    { stdio: 'inherit' }
  )
  execSync(
    `docker cp audius_ganache_cli_eth_contracts:/app/eth-contracts-ganache-accounts.json ${tmpEthContracts}/eth-contracts-ganache-accounts.json`,
    { stdio: 'inherit' }
  )

  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/eth-contracts/build ${tmpEthContracts}`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/discovery-provider/build/eth-contracts/ ${tmpEthContracts}/eth-contracts`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/libs/scripts/AudiusClaimDistributor.json ${tmpEthContracts}/eth-contracts`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/libs/scripts/Wormhole.json ${tmpEthContracts}/eth-contracts`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/eth-contracts/migrations/migration-output.json ${tmpEthContracts}`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/identity-service/eth-contract-config.json ${tmpEthContracts}`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/discovery-provider/eth_contract_config.ini ${tmpEthContracts}`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/eth-contracts/Dockerfile.cacheLedger ${tmpEthContracts}`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/libs/scripts/AudiusClaimDistributor.json ${tmpEthContracts}/build/contracts`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/libs/scripts/Wormhole.json ${tmpEthContracts}/build/contracts`,
    { stdio: 'inherit' }
  )

  execSync(`cp -r ~/.audius/aao-config.json ${tmpEthContracts}`, {
    stdio: 'inherit'
  })

  // ========== Copy the ledger & build artifacts for data ==========

  execSync(`docker cp audius_ganache_cli:/app/db ${tmpDataContracts}/db`, {
    stdio: 'inherit'
  })
  execSync(
    `docker cp audius_ganache_cli:/app/contracts-ganache-accounts.json ${tmpDataContracts}/contracts-ganache-accounts.json`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/contracts/migrations/migration-output.json ${tmpDataContracts}`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/contracts/build ${tmpDataContracts}`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/identity-service/contract-config.json ${tmpDataContracts}`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/discovery-provider/contract_config.ini ${tmpDataContracts}`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/discovery-provider/build/contracts/ ${tmpDataContracts}/contracts`,
    { stdio: 'inherit' }
  )
  execSync(
    `cp -r ${process.env.PROTOCOL_DIR}/contracts/Dockerfile.cacheLedger ${tmpDataContracts}`,
    { stdio: 'inherit' }
  )

  const gitHash = await getGitHash()
  await writeMetadata({ gitHash, path: tmpEthContracts })
  await writeMetadata({ gitHash, path: tmpDataContracts })

  // Make the dockerfile
  execSync(
    `cd ${tmpEthContracts} && docker build -f Dockerfile.cacheLedger -t audius/ganache:eth-contracts-predeployed-latest .`,
    { stdio: 'inherit' }
  )
  execSync(
    `docker tag audius/ganache:eth-contracts-predeployed-latest audius/ganache:eth-contracts-predeployed-${gitHash}`,
    { stdio: 'inherit' }
  )

  execSync(
    `cd ${tmpDataContracts} && docker build -f Dockerfile.cacheLedger -t audius/ganache:data-contracts-predeployed-latest .`,
    { stdio: 'inherit' }
  )
  execSync(
    `docker tag audius/ganache:data-contracts-predeployed-latest audius/ganache:data-contracts-predeployed-${gitHash}`,
    { stdio: 'inherit' }
  )

  execSync('docker kill audius_ganache_cli && docker rm audius_ganache_cli', {
    stdio: 'inherit'
  })
  execSync(
    'docker kill audius_ganache_cli_eth_contracts && docker rm audius_ganache_cli_eth_contracts',
    { stdio: 'inherit' }
  )

  // TODO: Deploy to docker registry (dockerhub)
  // Be sure to run 'A network up' to create local docker network before running this file
  // Ex. After local tag - docker push audius/ganache:data-contracts-predeployed-7a65bc3a54d5f84e1be805892935e121574b0772
  console.log('Be sure to publish the docker file if using externally')
  console.log(
    'ie. "docker push audius/ganache:data-contracts-predeployed-latest"'
  )
}

main()
