import {
  Box,
  Flex,
  IconAudiusLogoHorizontal,
  IconCaretLeft,
  PlainButton,
  iconSizes
} from '@audius/harmony'
import { useHistory } from 'react-router-dom'

type MobileNavHeaderProps = {
  isBackAllowed?: boolean
}
export const MobileNavHeader = (props: MobileNavHeaderProps) => {
  const { isBackAllowed = true } = props
  const history = useHistory()
  const handleBackClick = () => {
    history.goBack()
  }
  return (
    <Flex
      ph='xl'
      pv='l'
      w='100%'
      css={(theme) => ({
        backgroundColor: theme.color.background.white,
        borderBottom: `solid 1px ${theme.color.border.default}`
      })}
    >
      <Box css={{ height: iconSizes.l, width: iconSizes.l }}>
        {isBackAllowed ? (
          <PlainButton
            onClick={() => {
              handleBackClick()
            }}
          >
            <IconCaretLeft color='subdued' />
          </PlainButton>
        ) : null}
      </Box>
      {/* mr to offset no icon on the right */}
      <Box mr='xl' css={{ flex: '1' }}>
        <IconAudiusLogoHorizontal
          color='subdued'
          // icon size prop changes width & height, we only want height
          css={{ height: iconSizes.l }}
        />
      </Box>
    </Flex>
  )
}
