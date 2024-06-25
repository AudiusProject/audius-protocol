import { Buffer } from 'buffer'

import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex as toHex } from '@noble/hashes/utils'
import CRC32C from 'crc-32/crc32c'

class NodeScore {
  node: Buffer
  score: number

  constructor(node: Buffer) {
    this.node = node
    this.score = 0
  }
}

/**
 * TypeScript equivalent of https://github.com/tysonmote/rendezvous/blob/be0258dbbd3d/rendezvous.go
 */
export class RendezvousHash {
  private readonly nodes: NodeScore[] = []

  constructor(...nodes: string[]) {
    this.add(...nodes)
  }

  add(...nodes: string[]): void {
    for (const node of nodes) {
      this.nodes.push(new NodeScore(Buffer.from(node)))
    }
  }

  getNodes(): string[] {
    return this.nodes.map((nodeScore) => nodeScore.node.toString())
  }

  get(key: string): string {
    const first = this.getN(1, key)[0]
    return first ?? ''
  }

  getN(n: number, key: string): string[] {
    const legacy = this.getNcrc32(2, key)
    const modern = this.rendezvous256(key).filter(
      (h) => legacy.indexOf(h) === -1
    )
    return [...legacy, ...modern].slice(0, n)
  }

  getNcrc32(n: number, key: string): string[] {
    const keyBytes = Buffer.from(key)
    for (const node of this.nodes) {
      node.score = this.hash(node.node, keyBytes)
    }

    this.nodes.sort((a, b) => {
      if (a.score === b.score) {
        return a.node.compare(b.node)
      }
      return b.score - a.score
    })

    if (n > this.nodes.length) {
      n = this.nodes.length
    }

    const nodes: string[] = []
    for (let i = 0; i < n; i++) {
      nodes.push(this.nodes[i]!.node.toString())
    }
    return nodes
  }

  rendezvous256(key: string) {
    const tuples = this.nodes.map((n) => {
      const hostName = n.node.toString()
      return [hostName, toHex(sha256(`${hostName}${key}`))]
    })
    tuples.sort((t1, t2) => {
      const [aHost, aScore] = t1
      const [bHost, bScore] = t2
      if (aScore === bScore) {
        return aHost! < bHost! ? -1 : 1
      }
      return aScore! < bScore! ? -1 : 1
    })
    return tuples.map((t) => t[0]!)
  }

  private hash(node: Buffer, key: Buffer): number {
    const combined = Buffer.concat([key, node])
    // Convert to unsigned 32-bit integer to match go implementation, which is uint32 here:
    // https://github.com/tysonmote/rendezvous/blob/be0258dbbd3d/rendezvous.go#L92
    return CRC32C.buf(combined, 0) >>> 0
  }
}

export default RendezvousHash
