import type { CrossPlatformFile, NodeFile } from '../types/File'

export const isNodeFile = (file: CrossPlatformFile): file is NodeFile => {
  if (file && (file as NodeFile).buffer) {
    return true
  }
  return false
}

export const isFileValid = (file: CrossPlatformFile) => {
  // If in a Node environment
  if (isNodeFile(file)) {
    return !!file.name
  }

  // If in a browser environment
  return file && typeof file === 'object'
}
