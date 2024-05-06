import { AudiusLibs, AudiusSdk, DiscoveryNodeSelector, sdk } from "@audius/sdk"
import { config } from "./config"

/** private handles for sdk and libs, null is not initialized yet */

let audiusSdk: AudiusSdk | null = null
let audiusLibs: AudiusLibs | null = null

/** lazy initialization getters for sdk and libs */

export const getSdk = async (): Promise<AudiusSdk> => {
    if (audiusSdk !== null) return audiusSdk
    // init sdk
    const discoveryNodeSelector = new DiscoveryNodeSelector({
        // use self instead of service discovery
        initialSelectedNode: config.endpoint
    })
    audiusSdk = sdk({
        apiKey: "not sure here yet",
        services: {
            discoveryNodeSelector,
        },
        appName: `solana-relay-${config.endpoint}`
    })
    // call self again once set
    return getSdk()
}
