import * as anchor from '@project-serum/anchor';
import BN from 'bn.js';
import { randomBytes } from 'crypto';
import * as secp256k1 from 'secp256k1';
import keccak256 from 'keccak256';
const { PublicKey } = anchor.web3;

/// Convert a string input to output array of Uint8
export const ethAddressToArray = (ethAddress: string) => {
    const strippedEthAddress = ethAddress.replace('0x', '')
    return Uint8Array.of(...new BN(strippedEthAddress, 'hex').toArray('be'))
}

/// Generate a key from random bytes, used for testing
export const getRandomPrivateKey = () => {
    const msg = randomBytes(32)
    let privKey: Uint8Array
    do {
      privKey = randomBytes(32)
    } while (!secp256k1.privateKeyVerify(privKey))
    return privKey
}

/// Sign any bytes object with the provided eth private key
export const signBytes = (bytes: any, ethPrivateKey: string ) => {
    const ethPrivateKeyArr = Buffer.from(ethPrivateKey, 'hex')
    const msgHash = keccak256(bytes)
    const signatureObj = secp256k1.ecdsaSign(
        Uint8Array.from(msgHash),
        ethPrivateKeyArr
    )
    const signature = Buffer.from(signatureObj.signature)
    return {
        signature,
        recoveryId: signatureObj.recid
    }
}

/// Generate random valid string
export const randomString = (size: number) => {
    if (size === 0) {
     throw new Error('Zero-length randomString is useless.');
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789';
    let objectId = '';
    const bytes = randomBytes(size)

    for (let i = 0; i < bytes.length; ++i) {
     objectId += chars[bytes.readUInt8(i) % chars.length];
    }

    return objectId;
}

/// Generate mock CID by appending `Qm` with a rand string
export const randomCID = () => {
    let randomSuffix = randomString(44)
    let cid = `Qm${randomSuffix}`
    return cid
}

/// Derive a program address with pubkey as the seed
export const findProgramAddress = (programId: anchor.web3.PublicKey, pubkey: any) => {
    return PublicKey.findProgramAddress(
        [pubkey.toBytes().slice(0, 32)],
        programId
    )
}

  // Finds a 'derived' address by finding a programAddress with
  // seeds array  as first 32 bytes of base + seeds
export const findDerivedAddress = async (programId: anchor.web3.PublicKey, base: anchor.web3.PublicKey, seed: any) => {
    let finalSeed = [base.toBytes().slice(0, 32), seed]
    let result = await PublicKey.findProgramAddress(
      finalSeed,
      programId
    )
    return {
      seed: finalSeed,
      result
    }
}

// Finds the target PDA with the base audius admin as the initial seed
// In conjunction with the secondary seed as the users handle in bytes
export const findDerivedPair = async (programId, adminAccount, seed) => {
    const [baseAuthorityAccount] = await findProgramAddress(
      programId,
      adminAccount
    )
    const derivedAddresInfo = await findDerivedAddress(
      programId,
      baseAuthorityAccount,
      seed
    )

    const derivedAddress = derivedAddresInfo.result[0]
    const bumpSeed = derivedAddresInfo.result[1]

    return  {baseAuthorityAccount, derivedAddress, bumpSeed }
}
