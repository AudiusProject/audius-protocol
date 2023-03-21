import { theGraphFetcher } from '../src/useServiceProviders'

theGraphFetcher('prod', 'discovery-node').then((sps) => {
  for (let sp of sps) {
    console.log(sp.endpoint)
  }
})
