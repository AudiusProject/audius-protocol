import { useEffect, useState } from 'react'

import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { getSignOn } from 'common/store/pages/signon/selectors'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_PAGE } from 'utils/route'

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
import { SignUpStep } from './pages/types'

type SignUpRootState =
  | SignUpState
  | CreatePasswordState
  | PickHandleState
  | FinishProfileState
  | SelectGenreState
  | SelectArtistsState
// | AppCtaState

// TODO: type this correctly
const determineAllowedRoute = (signUpData: any, routeAttempt: SignUpStep) => {
  let allowedRoutes = [SignUpStep.createAccount]
  if (signUpData.email.value) {
    allowedRoutes.push(SignUpStep.createPassword)
    // SignUpStep.createAccount
  }
  if (signUpData.password.value) {
    allowedRoutes.push(SignUpStep.pickHandle)
  }
  if (signUpData.handle.value) {
    allowedRoutes.push(SignUpStep.finishProfile)
  }
  if (signUpData.name.value) {
    // At this point the account is created and we can no longer go back to previous steps
    allowedRoutes = [SignUpStep.selectGenres]
  }
  // TODO: need to get this from a different part of the store
  if (signUpData.genres?.value) {
    allowedRoutes.push(SignUpStep.selectArtists)
  }
  if (signUpData.artists?.value) {
    // TODO: if we're here we should be redirecting to /trending
  }

  const isAllowedRoute = allowedRoutes.includes(routeAttempt)
  // If requested route is allowed return that, otherwise return the last step in the route stack
  return isAllowedRoute ? routeAttempt : allowedRoutes[allowedRoutes.length - 1]
}

export const SignUpRootPage = () => {
  const [signUpState, setSignUpState] = useState<SignUpRootState>({
    stage: SignUpStep.createAccount
  })
  const currentStage = signUpState.stage
  const currentParams = useParams<{ step: SignUpStep }>()
  const navigate = useNavigateToPage()
  const signOnState = useSelector((state) => getSignOn(state))

  // Redirect handler logic
  useEffect(() => {
    const allowedRoute = determineAllowedRoute(signOnState, currentParams.step)
    // console.log(
    //   'Attempted to route to:',
    //   currentParams.step,
    //   '; now routing to ',
    //   allowedRoute
    // )
    // If the requested step is not allowed, redirect accordingly
    if (allowedRoute !== currentParams.step) {
      navigate(`${SIGN_UP_PAGE}/${allowedRoute}`)
    }
    // Sync the stage accordingly
    setSignUpState({ stage: allowedRoute })
  }, [currentParams, currentStage, navigate, signOnState])

  return (
    <div>
      {signUpState.stage === SignUpStep.createAccount ? <SignUpPage /> : null}
      {signUpState.stage === SignUpStep.createPassword ? (
        <CreatePasswordPage params={signUpState.params} />
      ) : null}
      {signUpState.stage === SignUpStep.pickHandle ? <PickHandlePage /> : null}
      {signUpState.stage === SignUpStep.finishProfile ? (
        <FinishProfilePage />
      ) : null}
      {signUpState.stage === SignUpStep.selectGenres ? (
        <SelectGenrePage />
      ) : null}
      {signUpState.stage === SignUpStep.selectArtists ? (
        <SelectArtistsPage />
      ) : null}
    </div>
  )
}
