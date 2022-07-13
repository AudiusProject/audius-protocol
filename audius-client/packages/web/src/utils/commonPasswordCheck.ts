const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const HIBP_URL = 'https://api.pwnedpasswords.com/range/'

export const commonPasswordCheck = async (
  password: string
): Promise<boolean> => {
  const digest = await window.crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(password)
  )
  const hash = Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  // 2 second limit on the API request
  const result = await Promise.race([
    fetch(`${HIBP_URL}${hash.slice(0, 5)}`),
    sleep(2000)
  ])

  if (result) {
    // @ts-ignore
    const text = (await result?.text()) as string
    const map = text.split(/\s+/g).map((s) => s.slice(0, s.indexOf(':')))
    return map.includes(hash.slice(5))
  }

  // Fallback to the common password list if the api does not respond in time
  const commonPasswordList = await import('./passwordListLazyLoader').then(
    (list) => list.commonPasswordList
  )

  return commonPasswordList.test(password) as boolean
}
