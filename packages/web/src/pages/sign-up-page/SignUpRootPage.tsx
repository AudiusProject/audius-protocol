import { useState } from 'react'

import { AppCtaPage, AppCtaState } from './pages/AppCtaPage'
import {
  CreatePasswordPage,
  CreatePasswordState
} from './pages/CreatePasswordPage'
import {
  FinishProfilePage,
  FinishProfileState
} from './pages/FinishProfilePage'
import { PickHandlePage, PickHandleState } from './pages/PickHandlePage'
import {
  SelectArtistsPage,
  SelectArtistsState
} from './pages/SelectArtistsPage'
import { SelectGenrePage, SelectGenreState } from './pages/SelectGenrePage'
import { SignUpPage, SignUpState } from './pages/SignUpPage'

type SignUpRootState =
  | SignUpState
  | CreatePasswordState
  | PickHandleState
  | FinishProfileState
  | SelectGenreState
  | SelectArtistsState
  | AppCtaState

export const SignUpRootPage = () => {
  const [signUpState, setSignUpState] = useState<SignUpRootState>({
    stage: 'sign-up'
  })

  return (
    <div>
      {signUpState.stage === 'sign-up' ? (
        <SignUpPage onNext={setSignUpState} />
      ) : null}
      {signUpState.stage === 'create-password' ? (
        <CreatePasswordPage
          onPrevious={setSignUpState}
          onNext={setSignUpState}
        />
      ) : null}
      {signUpState.stage === 'pick-handle' ? (
        <PickHandlePage onNext={setSignUpState} />
      ) : null}
      {signUpState.stage === 'finish-profile' ? (
        <FinishProfilePage onNext={setSignUpState} />
      ) : null}
      {signUpState.stage === 'select-genre' ? (
        <SelectGenrePage onNext={setSignUpState} />
      ) : null}
      {signUpState.stage === 'select-artists' ? (
        <SelectArtistsPage onNext={setSignUpState} />
      ) : null}
      {signUpState.stage === 'app-cta' ? <AppCtaPage /> : null}
    </div>
  )
}
