export type XmlFileRow = {
  id: number
  from_zip_file?: string // UUID string
  uploaded_by: number
  uploaded_at: Date
  xml_contents: string
  status: string
}

// This may change over time. Future rows would be added as optional fields, and logic needs to check for null.
export type ReleaseRowData = {
  title: string
  genre: string
  releaseDate: Date
  isUnlisted: boolean
  isPremium: boolean
  description: string
  license: string
  userId: string
  artistName: string
  fieldVisibility: {
    genre: boolean
    mood: boolean
    tags: boolean
    share: boolean
    play_count: boolean
    remixes: boolean
  }
}

export type ReleaseRow = {
  id: number
  from_xml_file?: number // Reference to XmlFileRow.id
  release_date: Date
  data: ReleaseRowData
  status: string
}
