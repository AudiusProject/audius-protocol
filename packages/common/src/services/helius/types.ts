export type HeliusCollection = {
  address: string
  name: string
  imageUrl: string
  externalLink: string
}

export type HeliusNFT = {
  interface: string
  id: string
  content: {
    $schema: string
    json_uri: string
    files: {
      uri: string
      mime: string
    }[]
    metadata: {
      description: string
      name: string
      symbol: string
      token_standard: string
    }
    links: {
      image: string
      animation_url: string
      external_url: string
    }
  }
  compression: {
    compressed: boolean
  }
  grouping: {
    group_key: string
    group_value: string
    collection_metadata?: {
      name: string
      symbol: string
      image: string
      description: string
      external_url: string
    }
  }[]
  creators: {
    address: string
    verified: boolean
    share: number
  }[]
  ownership: {
    owner: string
  }
  token_standard: string
  name: string
  description: string
  image_url: string
  metadata_url: string
  opensea_url: string
  // Audius added fields
  wallet: string
}
