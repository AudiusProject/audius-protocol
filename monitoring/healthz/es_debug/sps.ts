import { apiGatewayFetcher } from '../src/useServiceProviders'

apiGatewayFetcher('prod', 'discovery').then((sps) => {
  for (let sp of sps) {
    console.log(sp.endpoint)
  }
})
