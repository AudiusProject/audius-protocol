import { useState } from 'react'

import {
  CreatePasswordPage,
  CreatePasswordState
} from './pages/CreatePasswordPage'
import { PickHandlePage, PickHandleState } from './pages/PickHandlePage'
import { SignUpPage, SignUpState } from './pages/SignUpPage'

type SignUpRootState = SignUpState | CreatePasswordState | PickHandleState

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
      {signUpState.stage === 'create-password' ? <PickHandlePage /> : null}
    </div>
  )
}
