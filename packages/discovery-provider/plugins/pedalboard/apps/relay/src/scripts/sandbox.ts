import { decodeAbi } from "../abi";
import {
  DiscoveryNodeSelector,
  EntityManager,
  sdk,
  stagingConfig,
} from "@audius/sdk";
import dotenv from "dotenv";
import { ethers } from "ethers";

/**
 * File that you can run via `npm run sandbox` to do some manual testing.
 */
export const main = async () => {
  dotenv.config({ path: "./dev.env" });

  const provider = new ethers.providers.JsonRpcProvider(
    stagingConfig.web3ProviderUrl
  );
  const { chainId } = await provider.getNetwork();
  console.log(`chain id = ${chainId}`);

  const apiKey = process.env.SANDBOX_API_KEY;
  const apiSecret = process.env.SANDBOX_API_SECRET;
  const initialSelectedNode = stagingConfig.discoveryNodes[0];

  console.log(`using ${initialSelectedNode}`);

  const discoveryNodeSelector = new DiscoveryNodeSelector({
    initialSelectedNode: initialSelectedNode.endpoint,
  });

  const entityManager = new EntityManager({
    discoveryNodeSelector,
    web3ProviderUrl: stagingConfig.web3ProviderUrl,
    contractAddress: stagingConfig.entityManagerContractAddress,
    identityServiceUrl: stagingConfig.identityServiceUrl,
    useDiscoveryRelay: true,
  });
  const services = {
    discoveryNodeSelector,
    entityManager,
  };

  const audiusSdk = sdk({
    appName: "experimentalDiscoveryRelay",
    apiKey,
    apiSecret,
    services,
  });
  const { data } = await audiusSdk.users.getUserByHandle({
    handle: "totallynotalec",
  });
  const userId = data?.id!;
  const res = await audiusSdk.users.updateProfile({
    userId,
    metadata: {
      bio: `identity has no reigns on me ${new Date().getTime()}`,
    },
  });
  console.log({ res });
};

main().catch((e) => {
  console.error(e);
  process.exit();
});
