export interface TokenInfo {
  symbol: string
  name: string
  decimals: number
  icon?: React.ReactNode
  color?: string
  logoURI?: string
  address: string
  isStablecoin?: boolean
}

export interface SendTokensModalProps {
  mint: string
  onClose: () => void
  walletAddress: string
  isOpen: boolean
}

export interface SendTokensInputProps {
  mint: string
  onContinue: (amount: bigint, destinationAddress: string) => void
  onClose: () => void
  initialAmount?: string
  initialDestinationAddress?: string
}

export interface SendTokensConfirmationProps {
  mint: string
  amount: bigint
  destinationAddress: string
  onConfirm: () => void
  onBack: () => void
  onClose: () => void
}

export interface SendTokensProgressProps {
  mint: string
  amount: bigint
  destinationAddress: string
}

export interface SendTokensSuccessProps {
  mint: string
  amount: bigint
  destinationAddress: string
  onDone: () => void
  onClose: () => void
}

export interface SendTokensFailureProps {
  mint: string
  amount: bigint
  destinationAddress: string
  error: string
  onTryAgain: () => void
  onClose: () => void
}

export type SendTokensState = {
  step: 'input' | 'confirm' | 'progress' | 'success' | 'failure'
  amount: bigint
  destinationAddress: string
}
