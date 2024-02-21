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
    <Text variant='label' size='large' color='neutralLight4'>
      {label}
    </Text>
    {children}
  </div>
)
