import * as anchor from "@project-serum/anchor";
import { AnchorProvider, BorshInstructionCoder } from "@project-serum/anchor";
import BN from "bn.js";
import { randomBytes } from "crypto";
import * as secp256k1 from "secp256k1";
import keccak256 from "keccak256";
import { AudiusData } from "../target/types/audius_data";
import web3 from "web3";
import { LOCAL_DEV_SP_WALLETS, LOCAL_DEV_SP_PRIVATE_KEYS } from "./constants";
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
export const getTransaction = async (
  provider: AnchorProvider,
  txHash: string
) => {
  let info = await provider.connection.getTransaction(txHash);
  while (info == null) {
    info = await provider.connection.getTransaction(txHash);
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
  provider: AnchorProvider,
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

// used to convert u16 to little endian bytes
// so that our test PDA derivation
// can use the same seed format as
// the rust program (u16.to_le_bytes())
export const convertBNToSpIdSeed = (spId: anchor.BN) => {
  return Buffer.concat([Buffer.from("sp_id", "utf8"), spId.toBuffer("le", 2)]);
};

// used to convert u32 to little endian bytes
// so that our test PDA derivation
// can use the same seed format as
// the rust program (u32.to_le_bytes())
export const convertBNToUserIdSeed = (userId: anchor.BN) => {
  return userId.toBuffer("le", 4);
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
  const derivedAddressInfo = await findDerivedAddress(
    programId,
    baseAuthorityAccount,
    seed
  );

  const derivedAddress = derivedAddressInfo.result[0];
  const bumpSeed = derivedAddressInfo.result[1];

  return { baseAuthorityAccount, derivedAddress, bumpSeed };
};

export const getContentNode = async (
  program: anchor.Program<AudiusData>,
  adminStoragePublicKey: anchor.web3.PublicKey,
  spId: string
) => {
  const seed = convertBNToSpIdSeed(new anchor.BN(spId));

  const { baseAuthorityAccount, bumpSeed, derivedAddress } =
    await findDerivedPair(program.programId, adminStoragePublicKey, seed);

  return {
    spId: new anchor.BN(spId),
    baseAuthorityAccount,
    bumpSeed,
    derivedAddress,
  };
};

/**
 * converts hex eth pk value (eg 358edb5f358b697c32d3dd3c0107da5686353etcetc)
 * Uint8Array(32) to create web3 Keypair.
 */
export const hexPrivateKeyToUint8 = (hexPrivateKey: string): Uint8Array => {
  const fullHexAddress = `0x${hexPrivateKey}`;
  const uint8SecretKey = Uint8Array.from(web3.utils.hexToBytes(fullHexAddress));
  return uint8SecretKey;
};

type ContentNodeWalletAuthority = {
  contentNodeAuthority: anchor.web3.Keypair,
  delegateWallet: string,
}

/**
 * Returns object containing
 * content node delegate wallet address and
 * authority KeyPair based on spId; when deterministic=false
 * returns wallet address and keypair from local env
 */
export const getContentNodeWalletAndAuthority = ({
  spId,
  deterministic = true,
}: {
  spId: string;
  deterministic: boolean;
}): ContentNodeWalletAuthority => {
  const cnSpId = parseInt(spId);
  let delegatePrivateKey: string;
  let delegateWallet: string;
  let contentNodeAuthority: anchor.web3.Keypair;
  if (deterministic) {
    delegateWallet = LOCAL_DEV_SP_WALLETS[cnSpId];
    delegatePrivateKey = LOCAL_DEV_SP_PRIVATE_KEYS[cnSpId];
  } else {
    // fetch from env vars
    delegateWallet = process.env[`DELEGATE_WALLET_CN_${cnSpId}`];
    delegatePrivateKey = process.env[`DELEGATE_PRIVATE_KEY_CN_${cnSpId}`];
  }
  try {
    const seed = hexPrivateKeyToUint8(delegatePrivateKey);
    contentNodeAuthority = anchor.web3.Keypair.fromSeed(seed);
  } catch (error) {
    throw new Error(
      `Error getting keypair from delegate private key ${delegatePrivateKey}: ${error}`
    );
  }
  return {
    contentNodeAuthority,
    delegateWallet,
  };
};
