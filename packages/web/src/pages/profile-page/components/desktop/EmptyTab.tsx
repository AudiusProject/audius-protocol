import { ReactNode } from 'react'

type EmptyTabProps = {
  text?: string
  name?: string
  isOwner?: boolean
  tab?: 'playlists' | 'albums' | 'tracks' | 'reposts'
  style?: React.CSSProperties
}

const EmptyTab = ({ text, name, isOwner, tab, style }: EmptyTabProps) => {
  let message: ReactNode
  if (text) {
    message = text
  } else if (tab) {
    message = isOwner
      ? `You haven't created any ${tab} yet`
      : `${name} hasn't created any ${tab} yet`
  }

  return (
    <div className='emptyTab' style={style}>
      {message}
    </div>
  )
}

export default EmptyTab
