import type { PlainButtonProps } from '@audius/harmony-native'
import { IconCaretDown, PlainButton } from '@audius/harmony-native'
import { spacing } from 'app/styles/spacing'

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

const hitSlop = {
  left: spacing(8),
  right: spacing(8),
  top: spacing(4),
  bottom: spacing(4)
}

type ExpandHeaderToggleButtonProps = Partial<PlainButtonProps> & {
  isExpanded?: boolean
}

export const ExpandHeaderToggleButton = (
  props: ExpandHeaderToggleButtonProps
) => {
  const { isExpanded, ...other } = props

  return (
    <PlainButton
      variant='subdued'
      fullWidth={false}
      style={{ alignSelf: 'center' }}
      iconRight={IconCaretDown}
      styles={{
        icon: isExpanded ? { transform: [{ rotate: '180deg' }] } : undefined
      }}
      hitSlop={hitSlop}
      {...other}
    >
      {isExpanded ? messages.seeLess : messages.seeMore}
    </PlainButton>
  )
}
