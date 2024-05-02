import { Box, Flex, IconAudiusLogoHorizontal } from '@audius/harmony'

import styles from './NavBar.module.css'

interface ServerNavBarProps {}

export const ServerNavBar = (_props: ServerNavBarProps) => (
  <Box className={styles.container}>
    <Flex alignItems='center'>
      <IconAudiusLogoHorizontal sizeH='l' color='subdued' width='auto' />
    </Flex>
  </Box>
)
