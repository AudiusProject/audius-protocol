import { Button, Box, IconComponent } from '@audius/harmony'

import styles from './EmptyTable.module.css'

type EmptyTableProps = {
  primaryText: string
  secondaryText: string
  buttonLabel?: string
  buttonIcon?: IconComponent
  onClick?: () => void
}

const EmptyTable = (props: EmptyTableProps) => {
  const { primaryText, secondaryText, buttonLabel, buttonIcon, onClick } = props
  return (
    <div className={styles.emptySectionContainer}>
      <div className={styles.emptySectionText}>
        <div>
          {primaryText} <i className='emoji face-with-monocle' />
        </div>
        <div>{secondaryText}</div>
      </div>
      {buttonLabel ? (
        <Box mt='xl'>
          <Button variant='secondary' onClick={onClick} iconLeft={buttonIcon}>
            {buttonLabel}
          </Button>
        </Box>
      ) : null}
    </div>
  )
}

export default EmptyTable
