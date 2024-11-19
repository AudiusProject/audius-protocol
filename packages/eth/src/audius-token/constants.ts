export const AUDIUS_TOKEN_CONTRACT_ADDRESS =
  '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998'

export const audiusTokenTypes = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
} as const
