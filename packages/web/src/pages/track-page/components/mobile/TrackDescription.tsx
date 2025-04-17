import { useCallback, useState, useEffect, useRef } from 'react'

import { Nullable } from '@audius/common/utils'
import {
  Flex,
  PlainButton,
  IconCaretDown,
  IconCaretUp,
  spacing,
  useTheme
} from '@audius/harmony'
import { useMeasure } from 'react-use'

import { UserGeneratedText } from 'components/user-generated-text'

const MAX_DESCRIPTION_LINES = 8
const DEFAULT_LINE_HEIGHT = spacing.xl
// A little manual tweaking for it to look good
const HEIGHT_OFFSET = 4

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

type TrackDescriptionProps = {
  description: Nullable<string>
  className?: string
}

export const TrackDescription = ({
  description,
  className
}: TrackDescriptionProps) => {
  const { motion } = useTheme()
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [showToggle, setShowToggle] = useState(false)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)

  const handleToggleDescription = useCallback(() => {
    setIsDescriptionExpanded(!isDescriptionExpanded)
    // If we're collapsing, scroll the button into view
    if (isDescriptionExpanded && toggleButtonRef.current) {
      toggleButtonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      })
    }
  }, [isDescriptionExpanded])

  // This ref holds the description height for expansion
  const [descriptionRef, descriptionBounds] = useMeasure<HTMLDivElement>()

  // This ref holds the full content height for expansion
  const [fullContentRef, fullContentBounds] = useMeasure<HTMLDivElement>()

  // Calculate if toggle should be shown based on content height
  useEffect(() => {
    if (description && descriptionBounds.height && fullContentBounds.height) {
      const lineHeight = DEFAULT_LINE_HEIGHT
      const maxHeight = lineHeight * MAX_DESCRIPTION_LINES
      setShowToggle(fullContentBounds.height > maxHeight)
    }
  }, [description, descriptionBounds.height, fullContentBounds.height])

  if (!description) return null

  return (
    <Flex column gap='m'>
      <Flex
        direction='column'
        css={{
          transition: `height ${motion.expressive}, opacity ${motion.quick}`,
          overflow: 'hidden',
          height: isDescriptionExpanded
            ? fullContentBounds.height
            : Math.min(
                fullContentBounds.height,
                DEFAULT_LINE_HEIGHT * MAX_DESCRIPTION_LINES - HEIGHT_OFFSET
              )
        }}
      >
        <Flex ref={fullContentRef} direction='column'>
          <UserGeneratedText
            ref={descriptionRef}
            className={className}
            linkSource='track page'
          >
            {description}
          </UserGeneratedText>
        </Flex>
      </Flex>
      {showToggle && (
        <PlainButton
          ref={toggleButtonRef}
          iconRight={isDescriptionExpanded ? IconCaretUp : IconCaretDown}
          onClick={handleToggleDescription}
          css={{ alignSelf: 'flex-start' }}
        >
          {isDescriptionExpanded ? messages.seeLess : messages.seeMore}
        </PlainButton>
      )}
    </Flex>
  )
}
