import type { CreatePasswordParams } from './screens/CreatePasswordScreen'
import type { SignOnScreenParams } from './screens/SignOnScreen'

export type SignUpScreenParamList = {
  SignOn: SignOnScreenParams
  CreatePassword: CreatePasswordParams
  PickHandle: undefined
  FinishProfile: undefined
  SelectGenre: undefined
  SelectArtists: undefined
  ReviewHandle: undefined
  CreateLoginDetails: undefined
}
