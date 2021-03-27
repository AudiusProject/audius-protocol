import React from 'react'
import { isMobile } from 'utils/clientUtil'
import TopAPIModal from './TopAPI'
import TransferAudioMobileDrawer from './TransferAudioMobileDrawer'
import TrendingRewardsModal from './TrendingRewards'
import VerifiedUpload from './VerifiedUpload'

const RewardsModals = () => {
  return (
    <>
      <TrendingRewardsModal />
      <VerifiedUpload />
      <TopAPIModal />
      {isMobile() && <TransferAudioMobileDrawer />}
    </>
  )
}

export default RewardsModals
