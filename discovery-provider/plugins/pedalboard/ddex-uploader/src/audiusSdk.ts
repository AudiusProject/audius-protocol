import { AudiusSdk } from "@audius/sdk/src/sdk"
import Web3  from "web3"

(window as any).Web3 = Web3

// manually put type for type hints
export const audiusSdk: AudiusSdk = (window as any).audiusSdk({
    apiKey: "f4393adc26615a2e59d16b34589c0edc7388f73d",
    appName: "ddex-uploader"
})
