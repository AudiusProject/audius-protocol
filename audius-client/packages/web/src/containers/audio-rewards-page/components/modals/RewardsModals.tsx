import React, { Suspense, useEffect } from 'react'

import { isMobile } from 'utils/clientUtil'
import lazyWithPreload from 'utils/lazyWithPreload'

import ChallengeRewardsModal from './ChallengeRewards'
import TopAPIModal from './TopAPI'
import TransferAudioMobileDrawer from './TransferAudioMobileDrawer'
import TrendingRewardsModal from './TrendingRewards'
import VerifiedUpload from './VerifiedUpload'

const HCaptchaModal = lazyWithPreload(() => import('./HCaptchaModal'))

const RewardsModals = () => {
  // TODO: preload HCaptchaModal when we decide to turn it on

  return (
    <>
      <TrendingRewardsModal />
      <ChallengeRewardsModal />
      <VerifiedUpload />
      <TopAPIModal />
      <Suspense fallback={null}>
        <HCaptchaModal />
      </Suspense>
      {isMobile() && <TransferAudioMobileDrawer />}
    </>
  )
}

export default RewardsModals
