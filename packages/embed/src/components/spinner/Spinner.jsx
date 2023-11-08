import cn from 'classnames'

import styles from './Spinner.module.css'

const Spinner = ({ className, svgStyle }) => {
  return (
    <div className={cn(styles.container, className)}>
      <svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
        <circle
          cx='50'
          cy='50'
          r='45'
          style={{ ...svgStyle, fill: 'transparent' }}
        />
      </svg>
    </div>
  )
}

export default Spinner
