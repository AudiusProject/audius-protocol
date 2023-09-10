import magnifyingGlassImgSrc from 'assets/fonts/emojis/magnifying-glass.png'

import styles from './CreateChatEmptyResults.module.css'

const messages = {
  header: 'Search for Friends',
  content: 'Search for fellow music lovers and strike up a conversation.'
}

export const CreateChatEmptyResults = () => {
  return (
    <div className={styles.root}>
      <img className={styles.image} src={magnifyingGlassImgSrc} />
      <div className={styles.text}>
        <div className={styles.header}>{messages.header}</div>
        <div className={styles.content}>{messages.content}</div>
      </div>
    </div>
  )
}
