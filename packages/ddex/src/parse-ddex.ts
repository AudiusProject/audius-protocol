import { NodeStruct } from 'linkedom/types/mixin/parent-node'

// helpers
export function queryAll(node: any, ...fields: string[]): NodeStruct[] {
  for (const field of fields) {
    const hits = node.querySelectorAll(field)
    if (hits.length) return Array.from(hits)
  }
  return []
}

export function useFirstValue(node: any, ...fields: string[]) {
  for (const field of fields) {
    const hit = node.querySelector(field)
    if (hit) return hit.textContent.trim()
  }
}
