import styles from './Toast.module.css'

export const Toast = ({ text }) => {
  return <div className={styles.container}>{text}</div>
}

export default Toast
