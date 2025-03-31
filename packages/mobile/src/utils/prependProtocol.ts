export const prependProtocol = (url: string | null | undefined) =>
  !url?.match(/^https?:\/\//i) ? `https://${url}` : url
