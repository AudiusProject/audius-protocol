import { writeFile } from 'node:fs/promises'

const prodEndpoint =
  'https://api.thegraph.com/subgraphs/name/audius-infra/audius-network-mainnet'

const stageEndpoint =
  'https://api.thegraph.com/subgraphs/name/audius-infra/audius-network-goerli'

const gql = `
query ServiceProviders($skip: Int) {
  serviceNodes(where: {isRegistered: true}, orderBy: id, skip: $skip) {
    id
    endpoint
    isRegistered
    delegateOwnerWallet
    type {
      id
    }
  }
}
`

const bonusNodes = {
  stage: [
    {
      id: 'discovery-sandbox::4',
      endpoint: 'https://discoveryprovider4.staging.audius.co',
      isRegistered: false,
      delegateOwnerWallet: '0xb1C931A9ac123866372CEbb6bbAF50FfD18dd5DF',
      type: { id: 'discovery-node' },
    },
  ],
  prod: [
    {
      id: 'discovery-sandbox::4',
      endpoint: 'https://discoveryprovider4.audius.co',
      isRegistered: false,
      delegateOwnerWallet: '0x32bF5092890bb03A45bd03AaeFAd11d4afC9a851',
      type: { id: 'discovery-node' },
    },
    {
      id: 'discovery-sandbox::steve',
      endpoint: 'https://api.steve.audius.co',
      isRegistered: false,
      delegateOwnerWallet: '0xE6D7BE81A2A21bDEA7Df5CD11750ebF3293E5c82',
      type: { id: 'discovery-node' },
    },
  ],
}

async function main(isStage) {
  const endpoint = isStage ? stageEndpoint : prodEndpoint
  const dest = isStage ? 'src/sps/stage.json' : 'src/sps/prod.json'
  const bonus = isStage ? bonusNodes.stage : bonusNodes.prod

  let allSps = []
  while (true) {
    const resp = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        query: gql,
        variables: {
          skip: allSps.length,
        },
      }),
    })
    const data = await resp.json()
    const sps = data.data.serviceNodes
    if (!sps.length) {
      break
    }
    allSps = allSps.concat(sps)
  }

  allSps = allSps.concat(bonus)
  sortSPs(allSps)
  console.log(allSps)
  await writeFile(dest, JSON.stringify(allSps, undefined, 2))
}

function sortSPs(sps) {
  const hostSortKey = (sp) =>
    new URL(sp.endpoint).hostname.split('.').reverse().join('.')
  sps.sort((a, b) => (hostSortKey(a) < hostSortKey(b) ? -1 : 1))
}

main(false)
main(true)
