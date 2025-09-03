export type SetupFormValues = {
  coinName: string
  coinSymbol: string
  coinImage: File | null
}

export type SetupFormErrors = {
  coinName?: string
  coinSymbol?: string
}

export type SetupPageProps = {
  onContinue?: () => void
  onBack?: () => void
}

export type ImageUploadAreaProps = {
  fileInputRef: React.RefObject<HTMLInputElement>
  coinImage: File | null
  imageUrl: string | null
  onFileSelect: () => void
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export type CoinFormFieldsProps = {
  values: SetupFormValues
  errors: SetupFormErrors
  touched: {
    coinName?: boolean
    coinSymbol?: boolean
  }
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
}

export type StepHeaderProps = {
  stepInfo: string
  title: string
  description: string
}
