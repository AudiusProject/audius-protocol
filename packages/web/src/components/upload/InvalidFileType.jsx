import cn from 'classnames'
import PropTypes from 'prop-types'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { Spring } from 'react-spring/renderprops.cjs'

import { Text } from 'components/typography'

import styles from './InvalidFileType.module.css'

const messages = {
  type: 'Unsupported File Type',
  corrupted:
    'File is corrupted. Please ensure it is playable and stored locally.',
  size: 'File Too Large (Max 250MB)'
}

const InvalidFileType = (props) => {
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
            [props.className]: !!props.className
          })}
        >
          <Text
            className={styles.message}
            size='large'
            strength='strong'
            color='staticWhite'
          >
            {messages[props.reason]}
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

InvalidFileType.defaultProps = {
  reason: 'type'
}

export default InvalidFileType
