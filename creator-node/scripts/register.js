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

  const tx = await audiusLibs.ethContracts.ServiceProviderFactoryClient.registerWithDelegate(
    "content-node",
    config.get("creatorNodeEndpoint"),
    new BN("200000000000000000000000"),
    config.get("delegateOwnerWallet"),
    false,
  );
}

main()
