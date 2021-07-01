import React from 'react'

import { connect } from 'react-redux'
import { animated } from 'react-spring'

import { profileMeterDismissed } from 'containers/profile-page/store/actions'
import ProfileCompletionHeroCard from 'containers/profile-progress/components/ProfileCompletionHeroCard'
import {
  getOrderedCompletionStages,
  getProfilePageMeterDismissed,
  getIsAccountLoaded
} from 'containers/profile-progress/store/selectors'

import { useVerticalCollapse, useProfileCompletionDismissal } from './hooks'

const ORIGINAL_HEIGHT_PIXELS = 206

/**
 * `ConnectedProfileCompletionHeroCard` is the `ProfileCompletionHeroCard`
 *  connected to the redux store, with logic for dismissing/conditionally rendering
 *  the card.
 *
 * @param Object {
 *   isAccountLoaded,
 *   completionStages,
 *   isDismissed,
 *   onDismiss
 * }
 */
const ConnectedProfileCompletionHeroCard = ({
  isAccountLoaded,
  completionStages,
  isDismissed,
  onDismiss
}) => {
  const { isHidden, shouldNeverShow } = useProfileCompletionDismissal({
    onDismiss,
    isAccountLoaded,
    completionStages,
    isDismissed
  })
  const transitions = useVerticalCollapse(!isHidden, ORIGINAL_HEIGHT_PIXELS)

  return (
    <>
      {!shouldNeverShow
        ? transitions.map(({ item, key, props }) =>
            item ? (
              <animated.div style={props} key={key}>
                <ProfileCompletionHeroCard
                  completionStages={completionStages}
                  onDismiss={onDismiss}
                />
              </animated.div>
            ) : null
          )
        : null}
    </>
  )
}

const mapStateToProps = state => ({
  isAccountLoaded: getIsAccountLoaded(state),
  completionStages: getOrderedCompletionStages(state),
  isDismissed: getProfilePageMeterDismissed(state)
})

const mapDispatchToProps = dispatch => ({
  onDismiss: () => dispatch(profileMeterDismissed())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedProfileCompletionHeroCard)
