export type SignOnScreenType = 'sign-up' | 'sign-in'

export type SignOnScreenProps = {
  email: string
  onChangeEmail: (email: string) => void
  onChangeScreen: (screen: SignOnScreenType) => void
}
