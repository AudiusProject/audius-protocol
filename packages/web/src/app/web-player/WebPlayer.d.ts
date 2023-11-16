import { MutableRefObject } from 'react'

type WebPlayerProps = {
  mainContentRef: MutableRefObject<HTMLDivElement | undefined>
}

const WebPlayer: () => JSX.Element

export const MAIN_CONTENT_ID: 'mainContent'

export default WebPlayer
