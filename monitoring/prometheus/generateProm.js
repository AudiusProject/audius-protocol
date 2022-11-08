// this script generates prometheus.yml dynamically
// it uses audiusLibs to add known service providers to prometheus.yml

const fs = require('fs');
const dotenv = require('dotenv');
const AudiusLibs = require("@audius/libs");


const readFromFileAndWriteToStream = (stream, filename) => {
  stream.write(fs.readFileSync("./ymls/" + filename))
  stream.write("\n")
}

const generateJobYaml = ({ url, env, scheme = 'https', component = 'discovery-provider' }) => {
  url = url.replace("https://", "").replace("http://", "")
  sanitizedUrl = url.split(".").join("-")

  let yaml = `
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
  - job_name: '${sanitizedUrl}_postgres_exporter'
    scheme: '${scheme}'
    metrics_path: '/prometheus/postgres'
    static_configs:
      - targets: ['${url}']
        labels:
          host: '${url}'
          environment: '${env}'
          service: 'postgres'
          component: '${component}'
    metric_relabel_configs:
      - source_labels: [__name__]
        target_label: __name__
        replacement: postgres_$1
  - job_name: '${sanitizedUrl}_redis_exporter'
    scheme: '${scheme}'
    metrics_path: '/prometheus/redis'
    static_configs:
      - targets: ['${url}']
        labels:
          host: '${url}'
          environment: '${env}'
          service: 'redis'
          component: '${component}'
    metric_relabel_configs:
      - source_labels: [__name__]
        target_label: __name__
        replacement: redis_$1
  - job_name: '${sanitizedUrl}_linux_exporter'
    scheme: '${scheme}'
    metrics_path: '/prometheus/linux'
    static_configs:
      - targets: ['${url}']
        labels:
          host: '${url}'
          environment: '${env}'
          service: 'linux'
          component: '${component}'
    metric_relabel_configs:
      - source_labels: [__name__]
        target_label: __name__
        replacement: linux_$1
`

  if (component == 'discovery-node') {
    yaml += `
  - job_name: '${sanitizedUrl}_postgres_read_replica_exporter'
    scheme: '${scheme}'
    metrics_path: '/prometheus/postgres/read-replica'
    static_configs:
      - targets: ['${url}']
        labels:
          host: '${url}'
          environment: '${env}'
          service: 'postgres-read-replica'
          component: '${component}'
    metric_relabel_configs:
      - source_labels: [__name__]
        target_label: __name__
        replacement: postgres_$1
  - job_name: '${sanitizedUrl}_elasticsearch_exporter'
    scheme: '${scheme}'
    metrics_path: '/prometheus/elasticsearch'
    static_configs:
      - targets: ['${url}']
        labels:
          host: '${url}'
          environment: '${env}'
          service: 'elasticsearch'
          component: '${component}'
    metric_relabel_configs:
      - source_labels: [__name__]
        target_label: __name__
        replacement: elastic_$1
  `
  }

  return yaml
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
  const discoveryNodes = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList('discovery-node')
  const contentNodes = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList('content-node')
  const serviceProviders = [...discoveryNodes, ...contentNodes]

  // copy from environment-specific stubs
  readFromFileAndWriteToStream(stream, `${env}.yml`)

  // write a header to seperate this section from the stub above
  const heading = `${env} (auto-generated)`
  stream.write(`  ${"#".repeat(heading.length)}\n`);
  stream.write(`  # ${heading}\n`);
  stream.write(`  ${"#".repeat(heading.length)}\n`);

  for (const sp of serviceProviders) {
    const spEndpoint = sp.endpoint;
    const serviceType = sp.type
    const yamlString = generateJobYaml({ url: spEndpoint, env, component: serviceType })
    stream.write(yamlString);
    stream.write("\n")
  }
}

const main = async () => {

  const stream = fs.createWriteStream('prometheus.yml', { flags: 'a' });

  readFromFileAndWriteToStream(stream, "base.yml")

  if (process.env.PROM_ENV === "prod") {
    // our "production" deployment of prometheus-grafana-metrics will monitor
    // all of our environments

    await generateEnv(stream, "stage")
    await generateEnv(stream, "prod")

  } else if (process.env.PROM_ENV === "stage") {
    // when developing locally against some exporters, it may prove beneficial to
    // scrape staging nodes, but never production nodes in an attempt to minimize load

    await generateEnv(stream, "stage")

  } else {
    readFromFileAndWriteToStream(stream, "local.yml")
  }

  stream.end();
}

main()
