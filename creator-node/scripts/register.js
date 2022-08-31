const { libs: AudiusLibs } = require("@audius/sdk");
const config = require("../src/config");
const axios = require("axios");
const BN = require("bn.js");

async function main() {
  const ethWeb3 = await AudiusLibs.Utils.configureWeb3(
    config.get("ethProviderUrl"),
    config.get("ethNetworkId"),
    /* requiresAccount */ false,
  );
  
  if (!ethWeb3) {
    throw new Error("Failed to init audiusLibs due to ethWeb3 configuration error");
  }
  
  const audiusLibs = new AudiusLibs({
    ethWeb3Config: AudiusLibs.configEthWeb3(
      config.get("ethTokenAddress"),
      config.get("ethRegistryAddress"),
      ethWeb3,
      config.get("delegateOwnerWallet"),
    ),
    isDebug: true,
  });

  await audiusLibs.init();

  // Wait for node to be healthy
  let healthy = false;
  while (!healthy) {
    try {
      const { data } = await axios({
        url: "/health_check",
        baseURL: config.get("creatorNodeEndpoint"),
        method: "get",
        timeout: 1000,
      });

      healthy = data.data.healthy;
    } catch (e) {
    }

    if (!healthy) {
      console.log("waiting for node to be healthy");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  const tx = await audiusLibs.ethContracts.ServiceProviderFactoryClient.registerWithDelegate(
    "content-node",
    config.get("creatorNodeEndpoint"),
    new BN("200000000000000000000000"),
    config.get("delegateOwnerWallet"),
  );
}

main()
