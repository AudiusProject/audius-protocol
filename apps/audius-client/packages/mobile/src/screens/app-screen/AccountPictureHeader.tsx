import { accountSelectors } from '@audius/common'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'

import { ProfilePicture } from 'app/components/user'
import { makeStyles } from 'app/styles'
const { getAccountUser } = accountSelectors

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    height: spacing(8),
    width: spacing(8)
  }
}))

type AccountPictureHeaderProps = {
  onPress: () => void
}

export const AccountPictureHeader = (props: AccountPictureHeaderProps) => {
  const { onPress } = props
  const styles = useStyles()
  const accountUser = useSelector(getAccountUser)

  return (
    <TouchableOpacity onPress={onPress}>
      <ProfilePicture profile={accountUser} style={styles.root} />
    </TouchableOpacity>
  )
}
