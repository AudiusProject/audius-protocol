import { ALLOWED_MAX_AUDIO_SIZE_BYTES } from '@audius/common/utils'
import { Text } from '@audius/harmony'
import cn from 'classnames'
import PropTypes from 'prop-types'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { Spring } from 'react-spring/renderprops.cjs'

import styles from './InvalidFileType.module.css'

const messages = {
  type: 'Unsupported File Type',
  corrupted:
    'File is corrupted. Please ensure it is playable and stored locally.',
  size: `File Too Large (Max ${ALLOWED_MAX_AUDIO_SIZE_BYTES / 1000000}MB)`
}

const InvalidFileType = ({ className = '', reason, ...props }) => {
  return (
    <Spring
      from={{ opacity: 0.6 }}
      to={{ opacity: 1 }}
      key={'invalid-file-type'}
      config={{ duration: 200 }}
    >
      {(animProps) => (
        <div
          style={animProps}
          className={cn(styles.invalidFileType, {
            [className]: !!className
          })}
        >
          <Text
            variant='body'
            className={styles.message}
            size='l'
            strength='strong'
            color='staticWhite'
          >
            {messages[reason]}
          </Text>
        </div>
      )}
    </Spring>
  )
}

InvalidFileType.propTypes = {
  className: PropTypes.string,
  reason: PropTypes.oneOf(['type', 'size'])
}

export default InvalidFileType
