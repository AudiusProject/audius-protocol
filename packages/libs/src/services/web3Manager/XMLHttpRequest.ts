export type XMLHttpRequest = typeof window.XMLHttpRequest
export const getXMLHttpRequest = async (): Promise<
  typeof window.XMLHttpRequest
> => {
  if (typeof window === 'undefined' || window === null) {
    // @ts-ignore
    return (await import('xmlhttprequest')).XMLHttpRequest
  } else {
    return window.XMLHttpRequest
  }
}
