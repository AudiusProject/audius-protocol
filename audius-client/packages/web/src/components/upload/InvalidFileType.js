import cn from 'classnames'
import PropTypes from 'prop-types'
import { Spring } from 'react-spring/renderprops'

import styles from './InvalidFileType.module.css'

const messages = {
  type: 'Unsupported File Type',
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
          {messages[props.reason]}
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
