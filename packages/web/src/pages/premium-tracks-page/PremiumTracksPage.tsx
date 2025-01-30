import { usePremiumTracks } from '@audius/common/src/api/tan-query/usePremiumTracks'
import { premiumTracksPageLineupActions } from '@audius/common/store'

import EndOfLineup from 'components/lineup/EndOfLineup'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'

import { PremiumTracksPageContent as DesktopPremiumTracksPageContent } from './desktop/PremiumTracksPageContent'
import { PremiumTracksPageContent as MobilePremiumTracksPageContent } from './mobile/PremiumTracksPageContent'

const messages = {
  endOfLineupDescription: "Looks like you've reached the end of this list..."
}

export const PremiumTracksPage = () => {
  const ref = useMainContentRef()
  const premiumTracksData = usePremiumTracks()
  const isMobile = useIsMobile()
  const Content = isMobile
    ? MobilePremiumTracksPageContent
    : DesktopPremiumTracksPageContent

  const renderLineup = () => {
    return (
      <TanQueryLineup
        actions={premiumTracksPageLineupActions}
        scrollParent={ref.current}
        endOfLineup={
          <EndOfLineup description={messages.endOfLineupDescription} />
        }
        lineupQueryData={premiumTracksData}
        pageSize={premiumTracksData.pageSize}
      />
    )
  }
  return <Content lineup={renderLineup()} />
}
