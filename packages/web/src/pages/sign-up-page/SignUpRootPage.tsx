import { useState } from 'react'

import {
  CreatePasswordPage,
  CreatePasswordState
} from './pages/CreatePasswordPage'
import {
  FinishProfilePage,
  FinishProfileState
} from './pages/FinishProfilePage'
import { PickHandlePage, PickHandleState } from './pages/PickHandlePage'
import { SelectGenrePage, SelectGenreState } from './pages/SelectGenrePage'
import { SignUpPage, SignUpState } from './pages/SignUpPage'

type SignUpRootState =
  | SignUpState
  | CreatePasswordState
  | PickHandleState
  | FinishProfileState
  | SelectGenreState

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
          params={signUpState.params}
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
      {signUpState.stage === 'select-genre' ? <SelectGenrePage /> : null}
    </div>
  )
}
