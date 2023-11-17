import { MutableRefObject } from 'react'

type WebPlayerProps = {
  mainContentRef: MutableRefObject<HTMLDivElement | undefined>
}

const WebPlayer: () => JSX.Element

export default WebPlayer
