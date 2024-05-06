import { Connection } from "@solana/web3.js";
import { config } from "./config";


export const connections = config.solanaEndpoints.map(
    (endpoint) => new Connection(endpoint)
)

// for when you just need one connection
export const getConnection = (): Connection => {
    return connections[Math.floor(Math.random() * connections.length)]
}
