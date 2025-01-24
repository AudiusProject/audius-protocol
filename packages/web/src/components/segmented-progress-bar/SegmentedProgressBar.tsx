import { Box, Flex, useTheme } from '@audius/harmony'
import { range } from 'lodash'

interface SegmentedProgressBarProps {
  numSteps: number
  stepsComplete: number
  isCompact?: boolean
}

/**
 * `SegmentedProgressBar` displays a configurable amount of progress segments
 * indicating progress through some task.
 */
export const SegmentedProgressBar = ({
  numSteps,
  stepsComplete,
  isCompact = false
}: SegmentedProgressBarProps) => {
  const { color, spacing } = useTheme()
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
    <Flex
      borderRadius={isCompact ? 'm' : 'l'}
      border='strong'
      backgroundColor='white'
      css={{
        borderWidth: spacing.unitHalf,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Flex
        w={isCompact ? 144 : 206}
        h={isCompact ? spacing.unit6 : spacing.unit9}
        borderRadius={isCompact ? 'm' : 'l'}
        css={{
          background: color.special.gradient,
          // To keep the first segment from being cut off
          marginLeft: -1
        }}
      >
        <Flex
          w={isCompact ? 160 : 230}
          h={isCompact ? spacing.unit6 : spacing.unit9}
          css={{
            position: 'absolute',
            // To offset the first segments width inside the container
            left: -1 * spacing.unit1
          }}
        >
          {range(numSteps).map((_, i) => {
            const isComplete = i <= stepsComplete - 1
            const isLast = i === numSteps - 1
            return (
              <Box
                key={i}
                css={{
                  transform: 'skew(-15deg)',
                  flexGrow: 1,
                  backgroundColor: isComplete ? 'transparent' : 'white',
                  borderRight: isLast ? 'none' : '3px solid white',
                  transition: 'background-color 0.25s ease-out',
                  // To help with aliasing on the skew
                  marginLeft: -1,
                  marginRight: -1
                }}
              />
            )
          })}
        </Flex>
      </Flex>
    </Flex>
  )
}
