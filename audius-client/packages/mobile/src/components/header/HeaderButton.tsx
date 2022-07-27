import type { ButtonProps } from 'app/components/core'
import { Button } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const useStyles = makeStyles(({ palette, typography }) => ({
  root: {
    height: 24,
    minWidth: 88,
    backgroundColor: palette.secondary,
    borderRadius: 6
  },
  button: {
    paddingHorizontal: spacing(3)
  },
  text: {
    ...typography.body,
    fontFamily: typography.fontByWeight.bold,
    textTransform: 'none',
    color: palette.staticWhite
  }
}))

type HeaderButtonProps = ButtonProps

export const HeaderButton = (props: HeaderButtonProps) => {
  const styles = useStyles()

  return <Button variant='primary' size='small' styles={styles} {...props} />
}
