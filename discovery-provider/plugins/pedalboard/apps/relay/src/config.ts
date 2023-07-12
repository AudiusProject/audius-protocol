import dotenv from "dotenv";

export type Config = {
    environment: string,
    minGasPrice: number,
    highGasPrice: number,
    ganacheGasPrice: number,
    defaultGasLimit: number,
    rpcEndpoint: string,
    entityManagerContractAddress: string,
    entityManagerContractRegistryKey: string,
    relayerWallets: string,
}

export const readConfig = (): Config => {
    dotenv.config()
    return {
        environment: process.env.environment || "local",
        minGasPrice: parseInt(process.env.minGasPrice || "1000"),
        highGasPrice: parseInt(process.env.minGasPrice || "100000000"),
        ganacheGasPrice: parseInt(process.env.minGasPrice || "0"),
        defaultGasLimit: parseInt(process.env.minGasPrice || "0"),
        rpcEndpoint: process.env.rpcEndpoint || "http://localhost:8545",
        entityManagerContractAddress: process.env.entityManagerContractAddress || "",
        entityManagerContractRegistryKey: process.env.entityManagerContractRegistryKey || "EntityManager",
        relayerWallets: process.env.relayerWallets || '[]'
    }
}
