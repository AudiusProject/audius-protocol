class Web3Manager {
  getWalletAddress(): string
  sign(clientChallengeKey: string): Promise<string>
}

export default Web3Manager
