import { RefObject } from 'react'

import { CommentHistoryPage as DesktopCommentHistoryPage } from './components/desktop/CommentHistoryPage'

type CommentHistoryPageProps = {
  containerRef: RefObject<HTMLDivElement>
}

const CommentHistoryPage = ({ containerRef }: CommentHistoryPageProps) => {
  return (
    <DesktopCommentHistoryPage
      title='Comment History'
      containerRef={containerRef}
    />
  )
}

export default CommentHistoryPage
