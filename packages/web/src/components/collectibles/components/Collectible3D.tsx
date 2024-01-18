import { MutableRefObject, useEffect, useRef } from 'react'

import type { ModelViewerElement } from '@google/model-viewer'
import '@google/model-viewer/dist//model-viewer.min.js'

import { getScrollParent } from 'utils/scrollParent'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': Partial<ModelViewerElement> & {
        ref: MutableRefObject<Partial<ModelViewerElement> | null>
      }
    }
  }
}

export const Collectible3D = ({
  src,
  isMobile
}: {
  src: string
  isMobile: boolean
}) => {
  const ref = useRef<ModelViewerElement>(null)

  useEffect(() => {
    const modelViewer = ref.current
    if (modelViewer) {
      modelViewer.style.minWidth = '50vw'
      modelViewer.style.minHeight = '50vh'

      if (isMobile) {
        modelViewer.style.width = '100%'

        // for 3d objects, disable parent nft drawer element scrollability if user is on 3d object
        const scrollableAncestor = getScrollParent(modelViewer)
        let foundDrawerAncestor = false
        for (const item of (scrollableAncestor?.classList ?? []).values()) {
          if (item.includes('nftDrawer')) {
            foundDrawerAncestor = true
            break
          }
        }
        if (foundDrawerAncestor) {
          const scrollableAncestorElement = scrollableAncestor as HTMLElement
          const mouseEnterListener = () => {
            scrollableAncestorElement.style.overflowY = 'hidden'
          }
          const mouseLeaveListener = () => {
            scrollableAncestorElement.style.overflowY = 'scroll'
          }
          modelViewer.addEventListener('mouseenter', mouseEnterListener)
          modelViewer.addEventListener('mouseleave', mouseLeaveListener)

          return () => {
            modelViewer.removeEventListener('mouseenter', mouseEnterListener)
            modelViewer.removeEventListener('mouseleave', mouseLeaveListener)
          }
        }
      }
    }
  }, [isMobile, ref])

  return (
    <model-viewer
      auto-rotate
      camera-controls
      ar-status='not-presenting'
      ref={ref}
      src={src}
    />
  )
}
