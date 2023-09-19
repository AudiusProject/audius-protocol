import { AudiusSdk } from "@audius/sdk/src/sdk"
import Web3  from "web3"

(window as any).Web3 = Web3

// manually put type for type hints
export const audiusSdk: AudiusSdk = (window as any).audiusSdk({
    apiKey: "f4393adc26615a2e59d16b34589c0edc7388f73d",
    apiSecret: "cc9cf610b414e6ef0c58815892ded9e3a1ae2b70a4ce00cc0f9d8a0b722af79f",
    appName: "ddex-uploader"
})
