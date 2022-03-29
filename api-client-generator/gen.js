const { spawn } = require("child_process");
const { program } = require("commander");

program
  .option("--env <env>", "The environment of the DN to gen from", "prod")
  .option("--api-version <apiVersion>", "The API version", "v1")
  .option("--api-flavor <apiFlavor>", "The API flavor", "");

program.parse();

const { env, apiVersion, apiFlavor } = program.opts();

let baseURL = "";
if (env === "dev") {
  baseURL = "http://dn1_web-server_1:5000";
} else if (env === "stage") {
  // Hardcode a stage DN, it doesn't matter
  baseURL = "https://discoveryprovider.staging.audius.co";
} else if (env === "prod") {
  // Hardcode a prod DN, it doesn't matter
  baseURL = "https://discoveryprovider.audius.co";
}

const outputFolderName = apiFlavor === "" ? "default" : apiFlavor;

const apiPath = apiFlavor === "" ? apiVersion : `${apiVersion}/${apiFlavor}`;

const openApiGeneratorArgs = [
  "generate",
  "-g",
  "typescript-axios",
  "-i",
  `${baseURL}/${apiPath}/swagger.json`,
  "-o",
  `gen/${apiVersion}/${outputFolderName}`,
  "--skip-validate-spec",
  "--additional-properties=modelPropertyNaming=original,useSingleRequestParameter=true,withSeparateModelsAndApi=true,apiPackage=api,modelPackage=model",
  "-t",
  "template",
];

console.log("Running OpenAPI Generator:");
console.log(`openapi-generator-cli ${openApiGeneratorArgs.join(" ")}`);
const openApiGeneratorCLI = spawn(
  "openapi-generator-cli",
  openApiGeneratorArgs
);

openApiGeneratorCLI.stdout.on("data", (data) => {
  console.log(`${data}`);
});

openApiGeneratorCLI.stderr.on("data", (data) => {
  console.log(`${data}`);
});

openApiGeneratorCLI.on("error", (error) => {
  console.log(`error: ${error.message}`);
});

openApiGeneratorCLI.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
});
