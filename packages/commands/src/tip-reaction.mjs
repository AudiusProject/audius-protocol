import BN from "bn.js";
import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs, initializeAudiusSdk } from "./utils.mjs";

program.command("tip-reaction")
  .description("Send a tip reaction")
  .argument("<handle>", "users handle")
  .argument("<signature>", "signature of the tip to react to")
  .action(async (handle, signature) => {
    const audiusLibs = await initializeAudiusLibs(handle);

    // extract privkey and pubkey from hedgehog
    // only works with accounts created via audius-cmd
    const wallet = audiusLibs?.hedgehog?.getWallet()
    const privKey = wallet?.getPrivateKeyString()
    const pubKey = wallet?.getAddressString()

    // init sdk with priv and pub keys as api keys and secret
    // this enables writes via sdk
    const audiusSdk = await initializeAudiusSdk({ apiKey: pubKey, apiSecret: privKey })

    try {
        const { data: { id }} = await audiusSdk.users.getUserByHandle({ handle })
        await audiusSdk.users.sendTipReaction({
            userId: id,
            metadata: {
                reactedTo: signature,
                reactionValue: "🔥"
            }
        })

    } catch (err) {
        program.error(err.message)
    }
    process.exit(0);
  });
