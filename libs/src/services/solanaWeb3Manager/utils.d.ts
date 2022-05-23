export default class SolanaUtils {
  static signBytes: (bytes: any, ethPrivateKey: any) => any
  static prepareInstructionForRelay: (instruction: any) => any
  static constructTransferId: (challengeId: any, specifier: any) => string

  static constructAttestation: (
    recipientEthAddress: any,
    tokenAmount: any,
    transferId: any,
    oracleAddress: any
  ) => any

  static uiAudioToBNWaudio: (amount: any) => any

  static findProgramAddressFromPubkey: (
    programId: any,
    pubkey: any,
    seed: any
  ) => Promise<any>

  static findProgramAddressWithAuthority: (
    programId: any,
    address: any,
    seed: any
  ) => Promise<any>

  static ethAddressToArray: (ethAddress: any) => any

  // Safely create pubkey from nullable val
  static newPublicKeyNullable: (val: any) => any
}
