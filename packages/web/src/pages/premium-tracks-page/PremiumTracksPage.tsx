import { useEffect } from 'react'

import {
  premiumTracksPageLineupSelectors,
  premiumTracksPageLineupActions
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import EndOfLineup from 'components/lineup/EndOfLineup'
import Lineup from 'components/lineup/Lineup'
import { useLineupProps } from 'components/lineup/hooks'
import { LineupVariant } from 'components/lineup/types'
import { useIsMobile } from 'hooks/useIsMobile'

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

const useLineupReset = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    return () => {
      dispatch(premiumTracksPageLineupActions.reset())
    }
  }, [dispatch])
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

  useLineupReset()

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
