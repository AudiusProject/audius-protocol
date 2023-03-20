import fs from "fs-extra";
import path from "path";

function getConfigurationByFile(file: string) {
  const pathToConfigFile = path.resolve("cypress", "config", `${file}.json`);

  return fs.readJson(pathToConfigFile);
}

const pluginConfig: Cypress.PluginConfig = (on, config) => {
  const file = config.env.configFile || "dev";
  return getConfigurationByFile(file);
};

export default pluginConfig;
