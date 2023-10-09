type IdxImage = {
  src: string // ie. "ipfs://QmNnMqEbiG4HtMigg8mfPMr7LYewezncMHwAveQZyMqDp4",
  size: number
  width: number
  height: number
  mimeType: string // ie. "image/png"
}

export type IdxUser = {
  image?: {
    original: IdxImage
    alternatives: IdxImage[]
  }
  background?: {
    original: IdxImage
    alternatives: IdxImage[]
  }
  name?: string
  description?: string
  emoji?: string
  homeLocation?: string
  residenceCountry?: string
  url?: string
}
