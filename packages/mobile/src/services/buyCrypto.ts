export const getUSDCUserBank = async (ethWallet?: string) => {
  throw new Error('Not implemented')
}

export const createStripeSession = async ({
  destinationWallet,
  amount,
  destinationCurrency
}: {
  destinationWallet: string
  amount: string
  destinationCurrency: 'sol' | 'usdc'
}) => {
  throw new Error('Not implemented')
}
