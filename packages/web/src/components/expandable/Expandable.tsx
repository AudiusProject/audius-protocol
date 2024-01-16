import { Flex } from '@audius/harmony'
import { ResizeObserver } from '@juggle/resize-observer'
import useMeasure from 'react-use-measure'

export const Expandable = ({
  expanded,
  children
}: {
  expanded: boolean
  children: React.ReactNode
}) => {
  const [ref, bounds] = useMeasure({
    polyfill: ResizeObserver,
    offsetSize: true
  })

  return (
    <Flex
      direction='column'
      alignSelf='stretch'
      css={{
        transition: 'height var(--harmony-expressive)'
      }}
      style={{ height: expanded ? bounds.height : 0 }}
    >
      <Flex direction='column' ref={ref}>
        {children}
      </Flex>
    </Flex>
  )
}
