import * as ed from '@noble/ed25519'
import { base64 } from '@scure/base'

export async function sign(keypair: Keypair, body: string) {
  const payloadBytes = new TextEncoder().encode(body)
  return ed.sign(payloadBytes, keypair.privateKey)
  // return {
  //   publicKey: base64.encode(keypair.publicKey),
  //   signature: base64.encode(sig),
  // }
}

export async function verify(
  signature: string,
  body: string,
  publicKey: string
) {
  const pubkey = base64.decode(publicKey)
  const sig = base64.decode(signature)
  const payloadBytes = new TextEncoder().encode(body)
  return ed.verify(sig, payloadBytes, pubkey)
}

export type Keypair = {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

export async function makeKeypair(): Promise<Keypair> {
  const privateKey = ed.utils.randomPrivateKey()
  const publicKey = await ed.getPublicKey(privateKey)
  return { publicKey, privateKey }
}
