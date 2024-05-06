import { Connection, Keypair, TransactionInstruction } from '@solana/web3.js';
import * as solanaClient from './solana-client';
import { LocationData } from '../routes/listens/types';

// re-export getFeePayerKeypair with types
export type GetFeePayerKeypairFunction = (singleFeePayer: boolean) => Promise<Keypair>;
export const getFeePayerKeypair: GetFeePayerKeypairFunction = solanaClient.getFeePayerKeypair

// re-export createTrackListenInstructions with types
export type CreateTrackListenInstructionsParams = {
    privateKey: string
    userId: number
    trackId: number
    source: string
    location: LocationData,
    connection: Connection
}
export type CreateTrackListenInstructionsFunction = (params: CreateTrackListenInstructionsParams) => Promise<TransactionInstruction[]>
export const createTrackListenInstructions: CreateTrackListenInstructionsFunction = solanaClient.createTrackListenInstructions
