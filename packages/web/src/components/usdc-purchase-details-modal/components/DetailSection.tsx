import { Text } from '@audius/harmony'

import styles from './styles.module.css'

export const DetailSection = ({
  children,
  label
}: {
  children?: React.ReactNode
  label: string | React.ReactNode
}) => (
  <div className={styles.detailSection}>
    <Text variant='label' size='l' color='subdued'>
      {label}
    </Text>
    {children}
  </div>
)
