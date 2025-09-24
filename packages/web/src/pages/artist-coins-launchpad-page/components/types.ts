export type SetupFormValues = {
  coinName: string
  coinSymbol: string
  coinImage: File | null
  payAmount: string
  receiveAmount: string
  usdcValue: string
}

export type PhasePageProps = {
  onContinue?: () => void
  onBack?: () => void
}
