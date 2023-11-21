import { useCallback } from 'react'

import {
  Box,
  Flex,
  IconAudiusLogoHorizontal,
  IconCaretLeft,
  IconCloseAlt,
  PlainButton,
  PlainButtonSize,
  PlainButtonType,
  iconSizes
} from '@audius/harmony'
import { useHistory } from 'react-router-dom'

import { TRENDING_PAGE } from 'utils/route'

type MobileNavHeaderProps = {
  isBackAllowed?: boolean
}
export const MobileNavHeader = (props: MobileNavHeaderProps) => {
  const { isBackAllowed = true } = props
  const history = useHistory()

  const handleClose = useCallback(() => {
    history.push(TRENDING_PAGE)
  }, [history])

  return (
    <Flex
      ph='xl'
      pv='l'
      w='100%'
      css={(theme) => ({
        backgroundColor: theme.color.background.white,
        borderBottom: `solid 1px ${theme.color.border.default}`
      })}
      alignItems='center'
      justifyContent='space-between'
    >
      <PlainButton
        size={PlainButtonSize.LARGE}
        css={{ padding: 0 }}
        onClick={isBackAllowed ? history.goBack : handleClose}
        iconLeft={isBackAllowed ? IconCaretLeft : IconCloseAlt}
        variant={PlainButtonType.SUBDUED}
      />
      <IconAudiusLogoHorizontal color='subdued' css={{ height: iconSizes.l }} />
      <Box css={{ width: iconSizes.m }} />
    </Flex>
  )
}
