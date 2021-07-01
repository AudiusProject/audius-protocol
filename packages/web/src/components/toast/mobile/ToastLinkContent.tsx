import React, { useContext } from 'react'

import { Link } from 'react-router-dom'

import { ToastContext } from '../ToastContext'

import styles from './ToastLinkContent.module.css'

type ToastLinkContentProps = {
  link: string
  linkText: string
  text: string
}

/**
 * This component can be used as the content of a Toast to render a link
 * in addition to text
 */
const ToastLinkContent = ({ link, text }: ToastLinkContentProps) => {
  const { clear: clearToasts } = useContext(ToastContext)

  return (
    <div>
      <span className={styles.text}>{text}</span>
      <Link to={link} className={styles.link} onClick={clearToasts}>
        View
      </Link>
    </div>
  )
}

export default ToastLinkContent
