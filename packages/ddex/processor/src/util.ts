export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function parseBool(b: string | undefined): boolean {
  if (!b) return false
  b = b.toLowerCase().trim()
  return b != '' && b != '0' && b != 'false'
}

export function omitEmpty(obj: any) {
  const entries = Object.entries(obj).filter(([, v]) => Boolean(v))
  return Object.fromEntries(entries)
}
