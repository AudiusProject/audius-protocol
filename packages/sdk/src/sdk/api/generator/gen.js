const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const util = require('util')

const execAsync = util.promisify(exec)

const commander = require('commander')

const program = new commander.Command()

const OUT_DIR = 'src/sdk/api/generator/out'

const SWAGGER_JSON_PATH = path.join(OUT_DIR, 'swagger.json')

const OPEN_API_JSON_PATH = path.join(OUT_DIR, 'openapi.json')

const PROCESSED_JSON_PATH = path.join(OUT_DIR, 'processed.json')

const TEMPLATES_DIR = 'src/sdk/api/generator/templates'
const GENERATED_DIR = 'src/sdk/api/generated'

const spawnOpenAPIGenerator = async (openApiGeneratorArgs) => {
  console.info('Running OpenAPI Generator:')
  const fullCmd = `docker run --add-host=audius-protocol-discovery-provider-1:host-gateway --user $(id -u):$(id -g) --rm -v "${
    process.env.PWD
  }:/local" openapitools/openapi-generator-cli:v7.5.0 ${openApiGeneratorArgs.join(
    ' '
  )}`
  console.info(fullCmd)
  const { stderr, stdout } = await execAsync(fullCmd)
  if (stdout) {
    console.info('stdout:', stdout)
  }
  if (stderr) {
    console.warn('stderr:', stderr)
  }
}

const clearOutput = ({ apiFlavor }) => {
  fs.rmSync(path.join(process.env.PWD, OUT_DIR), {
    recursive: true,
    force: true
  })
  fs.rmSync(path.join(process.env.PWD, GENERATED_DIR, apiFlavor), {
    recursive: true,
    force: true
  })
  fs.mkdirSync(path.join(process.env.PWD, OUT_DIR))
}

const downloadSpec = async ({ env, apiVersion, apiFlavor }) => {
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
  const apiPath = apiFlavor === '' ? apiVersion : `${apiVersion}/${apiFlavor}`

  const res = await fetch(`${baseURL}/${apiPath}/swagger.json`)
  const json = await res.text()
  fs.writeFileSync(path.join(process.env.PWD, SWAGGER_JSON_PATH), json)
}

const upgradeSpec = async () => {
  const openApiGeneratorArgs = [
    'generate',
    '-g',
    'openapi',
    '-i',
    `/local/${SWAGGER_JSON_PATH}`,
    '-o',
    `/local/${OUT_DIR}`,
    '--skip-validate-spec'
  ]
  await spawnOpenAPIGenerator(openApiGeneratorArgs)
}

const processSpec = () => {
  const swagger = JSON.parse(
    fs.readFileSync(path.join(process.env.PWD, SWAGGER_JSON_PATH), 'utf-8')
  )
  const openApi = JSON.parse(
    fs.readFileSync(path.join(process.env.PWD, OPEN_API_JSON_PATH), 'utf-8')
  )

  for (const [key, value] of Object.entries(swagger.definitions)) {
    if (value.oneOf) {
      openApi.components.schemas[key] = value
    }
  }

  fs.writeFileSync(
    path.join(process.env.PWD, PROCESSED_JSON_PATH),
    JSON.stringify(openApi)
  )
}

const generate = async ({ apiFlavor, generator }) => {
  const outputFolderName = apiFlavor === '' ? 'default' : apiFlavor
  const openApiGeneratorArgs = [
    'generate',
    '-g',
    generator,
    '-i',
    `/local/${PROCESSED_JSON_PATH}`,
    '-o',
    `/local/${GENERATED_DIR}/${outputFolderName}`,
    '--skip-validate-spec',
    '--additional-properties=modelPropertyNaming=camelCase,useSingleRequestParameter=true,withSeparateModelsAndApi=true,apiPackage=api,modelPackage=model',
    '-t',
    `/local/${TEMPLATES_DIR}/${generator}`
  ]
  await spawnOpenAPIGenerator(openApiGeneratorArgs)
}

program
  .command('generate', { isDefault: true })
  .description('Generates the client')
  .option('--env <env>', 'The environment of the DN to gen from', 'prod')
  .option('--api-version <apiVersion>', 'The API version', 'v1')
  .option('--api-flavor <apiFlavor>', 'The API flavor', '')
  .option('--generator <generator>', 'The generator to use', 'typescript-fetch')
  .action(async (options) => {
    clearOutput(options)
    await downloadSpec(options)
    await upgradeSpec(options)
    processSpec(options)
    await generate(options)
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
      `/local/${TEMPLATES_DIR}/${generator}`
    ])
  })

async function main() {
  await program.parseAsync()
}
main()
