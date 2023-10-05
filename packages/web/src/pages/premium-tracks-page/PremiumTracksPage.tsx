import {
  premiumTracksPageLineupActions,
  premiumTracksPageLineupSelectors
} from '@audius/common'

import EndOfLineup from 'components/lineup/EndOfLineup'
import Lineup from 'components/lineup/Lineup'
import { useLineupProps } from 'components/lineup/hooks'
import { LineupVariant } from 'components/lineup/types'
import { useIsMobile } from 'utils/clientUtil'

import { PremiumTracksPageContent as DesktopPremiumTracksPageContent } from './desktop/PremiumTracksPageContent'
import { PremiumTracksPageContent as MobilePremiumTracksPageContent } from './mobile/PremiumTracksPageContent'

const { getLineup } = premiumTracksPageLineupSelectors

const messages = {
  endOfLineupDescription: "Looks like you've reached the end of this list..."
}

const usePremiumTracksLineup = (containerRef: HTMLElement) => {
  return useLineupProps({
    actions: premiumTracksPageLineupActions,
    getLineupSelector: getLineup,
    variant: LineupVariant.MAIN,
    scrollParent: containerRef
  })
}

type PremiumTracksPageProps = {
  containerRef: HTMLElement
}

export const PremiumTracksPage = ({ containerRef }: PremiumTracksPageProps) => {
  const lineupProps = usePremiumTracksLineup(containerRef)
  const isMobile = useIsMobile()
  const Content = isMobile
    ? MobilePremiumTracksPageContent
    : DesktopPremiumTracksPageContent
  const renderLineup = () => {
    return (
      <Lineup
        key='premium-tracks'
        endOfLineup={
          <EndOfLineup
            key='endOfLineup'
            description={messages.endOfLineupDescription}
          />
        }
        {...lineupProps}
      />
    )
  }
  return <Content lineup={renderLineup()} />
}
