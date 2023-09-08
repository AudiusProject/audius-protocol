export type Image = {
  height?: number
  width?: number
  name?: string
  size?: number
  fileType?: string
  url: string
  file?: string
  /**
   * Used to distinguish between images loaded via native
   * and images loaded on web
   * */
  type: 'base64'
}
