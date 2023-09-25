import { Buffer } from 'buffer'

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

  get(key: string): string {
    let maxScore = 0
    let maxNode: Buffer | null = null

    const keyBytes = Buffer.from(key)

    for (const node of this.nodes) {
      const score = this.hash(node.node, keyBytes)
      if (
        score > maxScore ||
        (score === maxScore && node.node.compare(maxNode!) < 0)
      ) {
        maxScore = score
        maxNode = node.node
      }
    }

    return maxNode?.toString() ?? ''
  }

  getN(n: number, key: string): string[] {
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

  getNodes(): string[] {
    return this.nodes.map((nodeScore) => nodeScore.node.toString())
  }

  private hash(node: Buffer, key: Buffer): number {
    const combined = Buffer.concat([key, node])
    // Convert to unsigned 32-bit integer to match go implementation, which is uint32 here:
    // https://github.com/tysonmote/rendezvous/blob/be0258dbbd3d/rendezvous.go#L92
    return CRC32C.buf(combined, 0) >>> 0
  }
}

export default RendezvousHash
