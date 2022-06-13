import { PureComponent } from 'react'

import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './LoadingPage.module.css'

const messages = {
  title: 'Your Account is Almost Ready to Rock',
  subTitle: 'We’re just finishing up a few things...'
}

export class LoadingPage extends PureComponent {
  render() {
    return (
      <div className={styles.container}>
        <div className={cn(styles.header)}>
          <LoadingSpinner className={styles.spinner} />
          <h2 className={styles.title}>
            {messages.title} <i className='emoji xl sign-of-the-horns' />
          </h2>
          <p className={styles.subTitle}>{messages.subTitle}</p>
        </div>
      </div>
    )
  }
}

LoadingPage.propTypes = {}

LoadingPage.defaultProps = {}

export default LoadingPage
