export type SignOnScreenType = 'sign-up' | 'sign-in'

export type SignOnScreenParams = {
  screen: SignOnScreenType
  guestEmail?: string
  routeOnCompletion?: string
}

export type SignOnScreenProps = {
  onChangeScreen: (screen: SignOnScreenType) => void
}
