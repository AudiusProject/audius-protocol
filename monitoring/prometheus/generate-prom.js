// this script generates prometheus.yml dynamically
// it uses audiusLibs to add known service providers to prometheus.yml

const fs = require('fs');
const dotenv = require('dotenv');
const AudiusLibs = require("@audius/libs");


const writeFromFile = (stream, filename) => {
  stream.write(fs.readFileSync("./ymls/" + filename))
  stream.write("\n")
}

const generateJobYaml = (url, env, scheme = 'https', component = 'discovery-provider') => {
  url = url.replace("https://", "").replace("http://", "")
  sanitizedUrl = url.split(".").join("-")

  return `
  - job_name: '${sanitizedUrl}'
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

const generateEnv = async (stream, env) => {
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

  // write a header to seperate this env from another
  stream.write(`  ${"#".repeat(env.length)}\n`);
  stream.write(`  ${env}\n`);
  stream.write(`  ${"#".repeat(env.length)}\n`);

  for (const sp of serviceProviders) {
    const spEndpoint = sp.endpoint;
    const yamlString = generateJobYaml(spEndpoint, env)
    stream.write(yamlString);
    stream.write("\n")
  }
}

const main = async () => {

  const stream = fs.createWriteStream('prometheus.yml', { flags: 'a' });

  writeFromFile(stream, "base.yml")
  writeFromFile(stream, "exporters.yml")
  writeFromFile(stream, "exporters-audius.yml")
  writeFromFile(stream, "load-tests.yml")

  if (process.env.PROM_ENV === "prod") {

    // include canary node targets
    writeFromFile(stream, "canaries.yml")

    // our "production" deployment of prometheus-grafana-metrics will monitor
    // all of our environments
    await generateEnv(stream, "stage")
    await generateEnv(stream, "prod")

  } else if (process.env.PROM_ENV === "stage") {

    // when developing locally against some exporters, it may prove beneficial to
    // scrape staging nodes, but never production nodes in an attempt to minimize load
    await generateEnv(stream, "stage")

  } else {

    // monitor local (remote-dev) setups that use docker
    writeFromFile(stream, "local.yml")
  }

  stream.end();
}

main()
