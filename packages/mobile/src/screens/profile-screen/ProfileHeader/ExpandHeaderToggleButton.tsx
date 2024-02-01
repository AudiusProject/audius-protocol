import { IconCaretDown } from '@audius/harmony-native'
import type { TextButtonProps } from 'app/components/core'
import { TextButton } from 'app/components/core'
import { makeStyles } from 'app/styles'
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

const useStyles = makeStyles(({ spacing }) => ({
  expandButton: {
    justifyContent: 'center',
    marginVertical: spacing(4),
    alignSelf: 'center'
  },
  seeLessIcon: {
    transform: [{ rotate: '180deg' }]
  }
}))

type ExpandHeaderToggleButtonProps = Partial<TextButtonProps> & {
  isExpanded?: boolean
}

export const ExpandHeaderToggleButton = (
  props: ExpandHeaderToggleButtonProps
) => {
  const { isExpanded, ...other } = props
  const styles = useStyles()

  return (
    <TextButton
      variant='neutralLight4'
      hitSlop={hitSlop}
      title={isExpanded ? messages.seeLess : messages.seeMore}
      icon={IconCaretDown}
      iconPosition='right'
      IconProps={{ height: 12, width: 12 }}
      TextProps={{ fontSize: 'small', weight: 'bold' }}
      styles={{
        root: styles.expandButton,
        icon: isExpanded && styles.seeLessIcon
      }}
      {...other}
    />
  )
}
