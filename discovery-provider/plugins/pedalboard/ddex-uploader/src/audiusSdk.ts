import { sdk } from "@audius/sdk/src/sdk"
import Web3  from "web3"

// typescript thing
(window as any).Web3 = Web3

export const audiusSdk = sdk({
    apiKey: "",
    apiSecret: "",
    appName: "ddex-uploader"
})
