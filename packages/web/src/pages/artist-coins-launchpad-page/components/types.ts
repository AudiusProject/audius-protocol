export type SetupFormValues = {
  coinName: string
  coinSymbol: string
  coinImage: File | null
  payAmount: string
  receiveAmount: string
  usdcValue: string
  wantsToBuy?: 'yes' | 'no' | undefined
}

export type PhasePageProps = {
  onContinue?: () => void
  onBack?: () => void
}
