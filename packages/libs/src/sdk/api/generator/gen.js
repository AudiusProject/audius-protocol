const { exec } = require('child_process')
const commander = require('commander')

const program = new commander.Command()

const spawnOpenAPIGenerator = (openApiGeneratorArgs) => {
  console.log('Running OpenAPI Generator:')
  const fullCmd = `docker run --add-host=audius-protocol-discovery-provider-1:host-gateway --rm -v "${
    process.env.PWD
  }:/local" openapitools/openapi-generator-cli ${openApiGeneratorArgs.join(
    ' '
  )}`
  console.log(fullCmd)
  const openApiGeneratorCLI = exec(fullCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }
    if (stdout) {
      console.log(`stdout: ${stdout}`)
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`)
    }
  })
  return openApiGeneratorCLI
}

const generate = ({ env, apiVersion, apiFlavor, generator }) => {
  // Setup args
  let baseURL = ''
  if (env === 'dev') {
    baseURL = 'http://audius-protocol-discovery-provider-1'
  } else if (env === 'stage') {
    // Hardcode a stage DN, it doesn't matter
    baseURL = 'https://discoveryprovider.staging.audius.co'
  } else if (env === 'prod') {
    // Hardcode a prod DN, it doesn't matter
    baseURL = 'https://discoveryprovider.audius.co'
  }
  const outputFolderName = apiFlavor === '' ? 'default' : apiFlavor
  const apiPath = apiFlavor === '' ? apiVersion : `${apiVersion}/${apiFlavor}`

  const openApiGeneratorArgs = [
    'generate',
    '-g',
    generator,
    '-i',
    `${baseURL}/${apiPath}/swagger.json`,
    '-o',
    `/local/src/sdk/api/generated/${outputFolderName}`,
    '--skip-validate-spec',
    '--additional-properties=modelPropertyNaming=camelCase,useSingleRequestParameter=true,withSeparateModelsAndApi=true,apiPackage=api,modelPackage=model',
    '-t',
    `/local/src/sdk/api/generator/templates/${generator}`
  ]
  spawnOpenAPIGenerator(openApiGeneratorArgs)
}

program
  .command('generate', { isDefault: true })
  .description('Generates the client')
  .option('--env <env>', 'The environment of the DN to gen from', 'prod')
  .option('--api-version <apiVersion>', 'The API version', 'v1')
  .option('--api-flavor <apiFlavor>', 'The API flavor', '')
  .option('--generator <generator>', 'The generator to use', 'typescript-fetch')
  .action((options) => {
    generate(options)
  })

program
  .command('template')
  .description('Download templates for the given generator')
  .argument(
    '[generator]',
    'The generator to download templates for',
    'typescript-fetch'
  )
  .action((generator) => {
    spawnOpenAPIGenerator([
      'author',
      'template',
      '-g',
      generator,
      '-o',
      `/local/templates/${generator}`
    ])
  })

program.parse()
