import {
  Box,
  HarmonyTheme,
  IconAudiusLogo,
  PlainButton,
  Text,
  useTheme
} from '@audius/harmony'
import { User as AudiusUser } from '@audius/sdk'
import { Card } from 'components/Card/Card'
import Loading from 'components/Loading'
import { Operator, Status, User } from 'types'

import UserImage from 'components/UserImage'
import UserBadges from 'components/UserInfo/AudiusProfileBadges'
import { useModalControls } from 'utils/hooks'
import { AUDIUS_DAPP_URL } from 'utils/routes'
import styles from './ProfileInfoCard.module.css'

import { ConnectAudiusProfileModal } from 'components/ConnectAudiusProfileModal/ConnectAudiusProfileModal'
import { PlainLink } from 'components/PlainLink/PlainLink'

const messages = {
  viewOnAudius: 'View On Audius',
  unlinkAudiusProfile: 'Unlink'
}

type DisconnectAudiusProfileButton = {
  wallet: string
}
export const DisconnectAudiusProfileButton = ({
  wallet
}: DisconnectAudiusProfileButton) => {
  const { isOpen, onClick, onClose } = useModalControls()

  return (
    <>
      <PlainLink onClick={onClick}>{messages.unlinkAudiusProfile}</PlainLink>
      <ConnectAudiusProfileModal
        wallet={wallet}
        isOpen={isOpen}
        onClose={onClose}
        action="disconnect"
      />
    </>
  )
}

type ProfileInfoCardProps = {
  isOwner?: boolean
  user: User | Operator
  audiusProfile?: AudiusUser | null
  status: Status
}

const ProfileInfo = ({
  user,
  audiusProfile,
  isOwner
}: ProfileInfoCardProps) => {
  const { name, wallet } = user
  const audiusProfileName = audiusProfile?.name
  const { spacing } = useTheme() as HarmonyTheme

  return (
    <>
      <div className={styles.imageContainer}>
        <Box css={{ position: 'absolute', left: spacing.xl }}>
          {audiusProfile == null ? null : (
            <PlainButton
              css={{
                textDecoration: 'none'
              }}
              iconLeft={IconAudiusLogo}
              asChild
            >
              <a
                aria-label="Go to user's Audius profile"
                target="_blank"
                rel="noreferrer"
                href={`${AUDIUS_DAPP_URL}/${audiusProfile?.handle}`}
              >
                {messages.viewOnAudius}
              </a>
            </PlainButton>
          )}
          {audiusProfile && isOwner ? (
            <Box className={styles.disconnectLink} mt="xs">
              <DisconnectAudiusProfileButton wallet={wallet} />
            </Box>
          ) : null}
        </Box>

        <UserImage
          className={styles.userImg}
          wallet={wallet}
          alt={'User Profile'}
        />
      </div>
      <div className={styles.userName}>
        <Text variant="title" size="l">
          {audiusProfileName ?? (name !== wallet && name)}
        </Text>
        {audiusProfile ? (
          <UserBadges inline audiusProfile={audiusProfile} badgeSize={14} />
        ) : null}
      </div>
      <Text variant="body" size="m">
        {wallet}
      </Text>
    </>
  )
}

const ProfileInfoCard = (props: ProfileInfoCardProps) => {
  return (
    <Card direction="column" alignItems="center" p="xl">
      {props.status !== Status.Success ? (
        <Loading />
      ) : (
        <ProfileInfo {...props} />
      )}
    </Card>
  )
}

export default ProfileInfoCard
