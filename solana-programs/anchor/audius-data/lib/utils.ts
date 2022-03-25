import * as anchor from "@project-serum/anchor";
import { BorshInstructionCoder, Provider } from "@project-serum/anchor";
import BN from "bn.js";
import { randomBytes } from "crypto";
import * as secp256k1 from "secp256k1";
import keccak256 from "keccak256";
import { AudiusData } from "../target/types/audius_data";
const { PublicKey } = anchor.web3;

export const SystemSysVarProgramKey = new PublicKey(
  "Sysvar1nstructions1111111111111111111111111"
);

/// Convert a string input to output array of Uint8
export const ethAddressToArray = (ethAddress: string) => {
  const strippedEthAddress = ethAddress.replace("0x", "");
  return Uint8Array.of(...new BN(strippedEthAddress, "hex").toArray("be", 20));
};

/// Retrieve a transaction with retries
export const getTransaction = async (provider: Provider, tx: string) => {
  let info = await provider.connection.getTransaction(tx);
  while (info == null) {
    info = await provider.connection.getTransaction(tx);
  }
  return info;
};

export const decodeInstruction = (program: anchor.Program, data: string) => {
  const instructionCoder = program.coder.instruction as BorshInstructionCoder;
  const decodedInstruction = instructionCoder.decode(data, "base58");
  return decodedInstruction;
};

export const getTransactionWithData = async (
  program: anchor.Program,
  provider: Provider,
  tx: string,
  instruction: number
) => {
  const info = await getTransaction(provider, tx);
  const data = info.transaction.message.instructions[instruction].data;
  const decodedInstruction = decodeInstruction(program, data);
  const accountIndexes =
    info.transaction.message.instructions[instruction].accounts;
  const accountKeys = info.transaction.message.accountKeys;
  const accountPubKeys = [];
  for (const i of accountIndexes) {
    accountPubKeys.push(accountKeys[i].toString());
  }
  const decodedData = decodedInstruction.data;
  return {
    info,
    data,
    decodedInstruction,
    decodedData,
    accountPubKeys,
  };
};

/// Sign any bytes object with the provided eth private key
export const signBytes = (bytes: Uint8Array, ethPrivateKey: string) => {
  const ethPrivateKeyArr = anchor.utils.bytes.hex.decode(ethPrivateKey);
  const msgHash = keccak256(bytes);
  const signatureObj = secp256k1.ecdsaSign(
    Uint8Array.from(msgHash),
    ethPrivateKeyArr
  );
  const signature = Buffer.from(signatureObj.signature);
  return {
    signature,
    recoveryId: signatureObj.recid,
  };
};

/// Generate random valid string
export const randomString = (size: number) => {
  if (size === 0) {
    throw new Error("Zero-length randomString is useless.");
  }

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" + "0123456789";
  let objectId = "";
  const bytes = randomBytes(size);

  for (let i = 0; i < bytes.length; ++i) {
    objectId += chars[bytes.readUInt8(i) % chars.length];
  }

  return objectId;
};

/// Generate random anchor BN id
export const randomId = () => {
  return new anchor.BN(Math.floor(Math.random() * 10000));
};


/// Generate mock CID by appending `Qm` with a rand string
export const randomCID = () => {
  const randomSuffix = randomString(44);
  const cid = `Qm${randomSuffix}`;
  return cid;
};

/// Derive a program address with pubkey as the seed
export const findProgramAddress = (
  programId: anchor.web3.PublicKey,
  pubkey: anchor.web3.PublicKey
) => {
  return PublicKey.findProgramAddress(
    [pubkey.toBytes().slice(0, 32)],
    programId
  );
};

// Finds a 'derived' address by finding a programAddress with
// seeds array  as first 32 bytes of base + seeds
export const findDerivedAddress = async (
  programId: anchor.web3.PublicKey,
  base: anchor.web3.PublicKey,
  seed: Buffer | Uint8Array
) => {
  const finalSeed = [base.toBytes().slice(0, 32), seed];
  const result = await PublicKey.findProgramAddress(finalSeed, programId);
  return {
    seed: finalSeed,
    result,
  };
};

// Finds the target PDA with the base audius admin as the initial seed
// In conjunction with the secondary seed as the users handle in bytes
export const findDerivedPair = async (programId, adminAccount, seed) => {
  const [baseAuthorityAccount] = await findProgramAddress(
    programId,
    adminAccount
  );
  const derivedAddresInfo = await findDerivedAddress(
    programId,
    baseAuthorityAccount,
    seed
  );

  const derivedAddress = derivedAddresInfo.result[0];
  const bumpSeed = derivedAddresInfo.result[1];

  return { baseAuthorityAccount, derivedAddress, bumpSeed };
};

export const getContentNode = async (
  program: anchor.Program<AudiusData>,
  adminStoragePublicKey: anchor.web3.PublicKey,
  spId: string
) => {
  const seed = Buffer.concat([
    Buffer.from("sp_id", "utf8"),
    new anchor.BN(spId).toBuffer("le", 2),
  ]);

  const { baseAuthorityAccount, bumpSeed, derivedAddress } =
    await findDerivedPair(program.programId, adminStoragePublicKey, seed);

  return {
    spId: new anchor.BN(spId),
    baseAuthorityAccount,
    bumpSeed,
    derivedAddress,
  };
};