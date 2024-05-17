import { Connection } from "@solana/web3.js";
import { config } from "../config";

export const connections = config.solanaEndpoints.map(
    (endpoint) => new Connection(endpoint)
)
