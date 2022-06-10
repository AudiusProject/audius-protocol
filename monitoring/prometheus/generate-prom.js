// this script generates prometheus.yml dynamically
// it uses audiusLibs to add known service providers to prometheus.yml

const fs = require('fs');
const dotenv = require('dotenv');
const AudiusLibs = require("@audius/libs");

const ENVS = ["stage", "prod"]


const yaml = (url, env) => {
  url = url.replace("https://", "");
  url = url.replace("http://", "");

  sanatized_url = url.split(".").join("-")

  return `
  - job_name: '${sanatized_url}'
    scheme: https
    metrics_path: '/prometheus_metrics'
    static_configs:
      - targets: ['${url}']
        labels:
          host: '${url}'
          environment: '${env}'
          service: 'audius'
          component: 'discover-provider'`
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
      - targets: ['host.docker.internal:5000']
        labels:
          host: 'host.docker.internal'
          environment: 'remote-dev'
          service: 'audius'
          component: 'discover-provider'

  - job_name: 'load-test-populate'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['host.docker.internal:8000']
        labels:
          host: 'host.docker.internal'
          environment: 'load-test'
          service: 'audius'
          component: 'discover-provider'
          job: 'populate'

  - job_name: 'load-test-census-stage'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['host.docker.internal:8001']
        labels:
          host: 'host.docker.internal'
          environment: 'stage'
          service: 'audius'
          component: 'discover-provider'
          job: 'census'

  - job_name: 'load-test-census-prod'
    metrics_path: '/metrics'
    scrape_interval: 30m
    static_configs:
      - targets: ['host.docker.internal:8002']
        labels:
          host: 'host.docker.internal'
          environment: 'prod'
          service: 'audius'
          component: 'discover-provider'
          job: 'census'

  # monitor canary nodes

  - job_name: 'discoveryprovider4-audius-co'
  scheme: https
  metrics_path: '/prometheus_metrics'
  static_configs:
    - targets: ['discoveryprovider4.audius.co']
      labels:
        host: 'discoveryprovider4.audius.co'
        environment: 'prod'
        service: 'audius'
        component: 'discover-provider'
`)

  for (const env of ENVS) {
    dotenv.config({ path: `.env.${env}`, override: true });

    const ETH_REGISTRY_ADDRESS = process.env.REACT_APP_ETH_REGISTRY_ADDRESS
    const ETH_TOKEN_ADDRESS = process.env.REACT_APP_ETH_TOKEN_ADDRESS
    const ETH_OWNER_WALLET = process.env.REACT_APP_ETH_OWNER_WALLET
    const ETH_PROVIDER_URL = process.env.REACT_APP_ETH_PROVIDER_URL

    const ethWeb3Config = AudiusLibs.configEthWeb3(
      ETH_TOKEN_ADDRESS,
      ETH_REGISTRY_ADDRESS,
      ETH_PROVIDER_URL,
      ETH_OWNER_WALLET
    )

    const audiusLibs = new AudiusLibs({
      ethWeb3Config,
      isServer: true,
      enableUserReplicaSetManagerContract: true,
      preferHigherPatchForPrimary: true,
      preferHigherPatchForSecondaries: true
    })
    await audiusLibs.init()
    const serviceProviders = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList('discovery-node');

    for (const sp of serviceProviders) {
      const spEndpoint = sp.endpoint;
      const yamlString = yaml(spEndpoint, env)
      stream.write(yamlString);
      stream.write("\n")
    }
  }

  stream.end();
}

main()