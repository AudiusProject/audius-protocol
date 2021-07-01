import React, { PureComponent } from 'react'

import Spin from 'antd/lib/spin'
import cn from 'classnames'

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
          <Spin className={styles.spinner} size='large' />
          <div className={styles.title}>
            {messages.title} <i className='emoji xl sign-of-the-horns' />
          </div>
          <div className={styles.subTitle}>{messages.subTitle}</div>
        </div>
      </div>
    )
  }
}

LoadingPage.propTypes = {}

LoadingPage.defaultProps = {}

export default LoadingPage
