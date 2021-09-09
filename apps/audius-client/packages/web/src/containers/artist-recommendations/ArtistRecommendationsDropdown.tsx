import React, { useRef } from 'react'

import { useSpring, animated } from 'react-spring'

import { useFlag } from 'containers/remote-config/hooks'
import { FeatureFlags } from 'services/remote-config'

import {
  ArtistRecommendations,
  ArtistRecommendationsProps
} from './ArtistRecommendations'
import styles from './ArtistRecommendationsDropdown.module.css'

type ArtistRecommendationsDropdownProps = Omit<
  ArtistRecommendationsProps,
  'ref' | 'className' | 'itemClassName'
> & {
  isVisible: boolean
}

const fast = {
  tension: 300,
  friction: 40
}

export const ArtistRecommendationsDropdown = (
  props: ArtistRecommendationsDropdownProps
) => {
  const { isEnabled, isLoaded } = useFlag(
    FeatureFlags.ARTIST_RECOMMENDATIONS_ENABLED
  )
  const { isVisible } = props
  const childRef = useRef<HTMLElement | null>(null)

  const rect = childRef.current?.getBoundingClientRect()
  const childHeight = rect ? rect.bottom - rect.top : 0

  const spring = useSpring({
    opacity: isVisible ? 1 : 0,
    height: isVisible ? `${childHeight}px` : '0',
    from: { opacity: 0, height: `${childHeight}px` },
    config: fast
  })

  if (!isEnabled || !isLoaded) {
    return null
  }
  return (
    <animated.div className={styles.dropdown} style={spring}>
      <ArtistRecommendations
        ref={childRef}
        className={styles.artistRecommendations}
        itemClassName={styles.artistRecommendationsItem}
        {...props}
      />
    </animated.div>
  )
}
