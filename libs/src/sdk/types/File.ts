// Type representing a file in Node environment
export type NodeFile = {
  buffer: Buffer
  name: string
}

// Type representing a file in Node and browser environments
export type CrossPlatformFile = NodeFile | File
