import IconCaretDown from 'app/assets/images/iconCaretDown.svg'
import type { TextButtonProps } from 'app/components/core'
import { TextButton } from 'app/components/core'
import { makeStyles } from 'app/styles'

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

const useStyles = makeStyles(({ spacing }) => ({
  expandButton: {
    justifyContent: 'center',
    marginVertical: spacing(3),
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
