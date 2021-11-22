import React, { Suspense } from 'react'

import { isMobile } from 'utils/clientUtil'
import lazyWithPreload from 'utils/lazyWithPreload'

import ChallengeRewardsModal from './ChallengeRewards'
import TopAPIModal from './TopAPI'
import TransferAudioMobileDrawer from './TransferAudioMobileDrawer'
import TrendingRewardsModal from './TrendingRewards'
import VerifiedUpload from './VerifiedUpload'

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const HCaptchaModal = lazyWithPreload(() => import('./HCaptchaModal'))

const RewardsModals = () => {
  // TODO: preload HCaptchaModal when we decide to turn it on

  return (
    <>
      <TrendingRewardsModal />
      <ChallengeRewardsModal />
      <VerifiedUpload />
      <TopAPIModal />
      {!IS_NATIVE_MOBILE && (
        <Suspense fallback={null}>
          <HCaptchaModal />
        </Suspense>
      )}
      {!IS_NATIVE_MOBILE && isMobile() && <TransferAudioMobileDrawer />}
    </>
  )
}

export default RewardsModals
