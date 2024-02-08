import { useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { CommonState } from '~/store/index'
import { chatActions, chatSelectors } from '~/store/pages/chat'
const { getUnfurlMetadata } = chatSelectors
const { fetchLinkUnfurl } = chatActions

export const useLinkUnfurlMetadata = (
  chatId: string,
  messageId: string,
  href: string
) => {
  const dispatch = useDispatch()
  const metadata = useSelector((state: CommonState) =>
    getUnfurlMetadata(state, chatId, messageId)
  )

  useEffect(() => {
    if (!metadata) {
      dispatch(fetchLinkUnfurl({ chatId, messageId, href }))
    }
  }, [metadata, dispatch, chatId, messageId, href])

  return metadata
}
