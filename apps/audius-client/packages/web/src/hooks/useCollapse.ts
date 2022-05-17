import { useState, useEffect, MutableRefObject } from 'react'

import { Nullable } from 'common/utils/typeUtils'

const TRUNCATE_LINE_HEIGHT = 16
const MAX_NUM_LINES_AFTER_TRUNCATE_WEB = 4

type UseCollapseProps = {
  ref: MutableRefObject<Nullable<HTMLElement>>
  lineHeight?: number
  numLines?: number
}

export const useCollapse = ({
  ref,
  lineHeight = TRUNCATE_LINE_HEIGHT,
  numLines = MAX_NUM_LINES_AFTER_TRUNCATE_WEB
}: UseCollapseProps) => {
  const [isCollapsible, setIsCollapsible] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (ref?.current && !isCollapsed && !isCollapsible) {
      const height = parseInt(
        document.defaultView
          ?.getComputedStyle(ref.current, null)
          ?.getPropertyValue('height')
          ?.slice(0, -2) ?? '0'
      )
      const shouldCollapse = height / lineHeight > numLines
      if (shouldCollapse) {
        setIsCollapsed(true)
        setIsCollapsible(true)
      }
    }
  }, [ref, numLines, lineHeight, isCollapsed, isCollapsible])

  const handleToggleCollapse = () => setIsCollapsed(!isCollapsed)

  return { isCollapsible, isCollapsed, handleToggleCollapse }
}
