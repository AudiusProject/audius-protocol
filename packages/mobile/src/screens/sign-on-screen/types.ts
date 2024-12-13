import type { SignOnScreenParams } from './screens/SignOnScreen'

export type SignUpScreenParamList = {
  SignOn: SignOnScreenParams

  // Sign In
  ConfirmEmail: undefined

  // Sign Up
  CreatePassword: undefined
  PickHandle: undefined
  FinishProfile: undefined
  SelectGenre: undefined
  SelectArtists: undefined
  ReviewHandle: undefined
  CreateLoginDetails: undefined
  AccountLoading: undefined

  // For leaving signup
  HomeStack: { screen: 'Trending' }
}
