
const fs = require('fs');
const dotenv = require('dotenv');
const AudiusLibs = require("@audius/libs");

const ENVS = ["stage", "prod"]


const yaml = (url, env, scheme = 'https', component = 'discover-provider') => {
  url = url.replace("https://", "");
  url = url.replace("http://", "");

  sanitized_url = url.split(".").join("-")

  return `
  - job_name: '${sanitized_url}'
    scheme: '${scheme}'
    metrics_path: '/prometheus_metrics'
    static_configs:
      - targets: ['${url}']
        labels:
          host: '${url}'
          environment: '${env}'
          service: 'audius'
          component: '${component}'
  `
}

const main = async () => {

  const stream = fs.createWriteStream('prometheus.yml', { flags: 'a' });

  stream.write(`global:
  scrape_interval:     30s
  evaluation_interval: 15s
  # scrape_timeout is set to the global default (10s).

scrape_configs:
  # monitor itself

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

 # monitor docker-compose local setups

  - job_name: 'local-discovery-provider'
    metrics_path: '/prometheus_metrics'
    static_configs:
      - targets: ['localhost:5000']
        labels:
          host: 'host.docker.internal'
          environment: 'remote-dev'
          service: 'audius'
          component: 'discover-provider'
`)

  const localCNs = ['34.69.173.123:4000', '34.69.173.123:4001', '34.69.173.123:4002', '34.69.173.123:4003']
  for (const localCN of localCNs) {
    const yamlString = yaml(localCN, 'local', 'http', 'content-node')
    stream.write(yamlString);
    stream.write("\n")
  }

  // for (const env of ENVS) {
  //   dotenv.config({ path: `.env.${env}`, override: true });

  //   const ETH_REGISTRY_ADDRESS = process.env.REACT_APP_ETH_REGISTRY_ADDRESS
  //   const ETH_TOKEN_ADDRESS = process.env.REACT_APP_ETH_TOKEN_ADDRESS
  //   const ETH_OWNER_WALLET = process.env.REACT_APP_ETH_OWNER_WALLET
  //   const ETH_PROVIDER_URL = process.env.REACT_APP_ETH_PROVIDER_URL

  //   const ethWeb3Config = AudiusLibs.configEthWeb3(
  //     ETH_TOKEN_ADDRESS,
  //     ETH_REGISTRY_ADDRESS,
  //     ETH_PROVIDER_URL,
  //     ETH_OWNER_WALLET
  //   )

  //   const audiusLibs = new AudiusLibs({
  //     ethWeb3Config,
  //     isServer: true,
  //     enableUserReplicaSetManagerContract: true,
  //     preferHigherPatchForPrimary: true,
  //     preferHigherPatchForSecondaries: true
  //   })
  //   await audiusLibs.init()
  //   const serviceProviders = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList('discovery-node');

  //   for (const sp of serviceProviders) {
  //     const spEndpoint = sp.endpoint;
  //     const yamlString = yaml(spEndpoint, env)
  //     stream.write(yamlString);
  //     stream.write("\n")
  //   }
  // }

  stream.end();
}

main()