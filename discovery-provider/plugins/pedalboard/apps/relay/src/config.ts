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
        minGasPrice: parseInt(process.env.minGasPrice || (10 * Math.pow(10, 9)).toString()),
        highGasPrice: parseInt(process.env.minGasPrice || (25 * Math.pow(10, 9)).toString()),
        ganacheGasPrice: parseInt(process.env.minGasPrice || "39062500000"),
        defaultGasLimit: parseInt(process.env.minGasPrice || "0xf7100"),
        rpcEndpoint: process.env.rpcEndpoint || "http://localhost:8545",
        entityManagerContractAddress: process.env.entityManagerContractAddress || "",
        entityManagerContractRegistryKey: process.env.entityManagerContractRegistryKey || "EntityManager",
        relayerWallets: process.env.relayerWallets || '[]'
    }
}
