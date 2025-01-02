import cn from 'classnames'
import { range } from 'lodash'
import PropTypes from 'prop-types'

import styles from './SegmentedProgressBar.module.css'

/**
 * `SegmentedProgressBar` displays a configurable amount of progress segments
 * indicating progress through some task.
 */
const SegmentedProgressBar = ({
  numSteps,
  stepsComplete,
  isCompact = false
}) => {
  /**  Div hierarchy explanation:
   *
   * - Outermost div .container provides the grey border
   *
   * - Middle div .segmentContainerMask is inset from .container, providing the white 'gap' between the grey border
   *   and the segments, as well as masking the overflowing child .segment_conatiner div with `overflow: hidden`
   *
   * - Innermost div .segmentContainer contains the segments (wow!) and is slightly wider than the .segmentContainerMask
   *  so that the segments can 'fill out' the rounded corners of the .segmentContainerMask
   */
  return (
    <div
      className={cn(styles.container, {
        [styles.containerCompact]: isCompact
      })}
    >
      <div
        className={cn(styles.segmentContainerMask, {
          [styles.segmentContainerMaskCompact]: isCompact
        })}
      >
        <div
          className={cn(styles.segmentContainer, {
            [styles.segmentContainerCompact]: isCompact
          })}
        >
          {range(numSteps).map((_, i) => {
            const isVisible = i <= stepsComplete - 1
            return (
              <div
                key={i}
                className={cn(
                  styles.segment,
                  isVisible ? styles.segmentVisible : styles.segmentHidden
                )}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

SegmentedProgressBar.propTypes = {
  numSteps: PropTypes.number.isRequired,
  stepsComplete: PropTypes.number.isRequired,
  isCompact: PropTypes.bool // controls at what size the bar renders
}

export default SegmentedProgressBar
