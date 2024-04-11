import {
    Utils as AudiusUtils,
    AudiusSdk,
    sdk,
    AudiusLibs,
    developmentConfig,
    DiscoveryNodeSelector,
    EntityManager
  } from "@audius/sdk";

export class TestUser {

    private audiusSdk: AudiusSdk;
    private audiusLibs: AudiusLibs;
    handle: string;

    static async new(handle: string): Promise<TestUser> {
        const localStorage = new InMemoryStorage()
        // @ts-ignore
        const libs = new AudiusLibs({
            localStorage,
            useDiscoveryRelay: true
        })
        await libs.init()

        const wallet = libs?.hedgehog?.getWallet()
        const privKey = wallet?.getPrivateKeyString()
        const pubKey = wallet?.getAddressString()

        const audiusSdk = sdk({
            appName: `moshpit-${handle}`,
            apiKey: pubKey,
            apiSecret: privKey,
        })
        return new TestUser(handle, libs, audiusSdk)
    }

    constructor(handle: string, libs: AudiusLibs, sdk: AudiusSdk) {
        this.handle = handle
        this.audiusLibs = libs
        this.audiusSdk = sdk
    }

    sdk(): AudiusSdk {
        return this.audiusSdk
    }

    libs(): AudiusLibs {
        return this.audiusLibs
    }
}
