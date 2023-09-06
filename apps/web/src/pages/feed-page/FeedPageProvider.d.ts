import { FeedPageContentProps } from './types'

type FeedPageProviderProps = {
  containerRef: RefObject<HTMLDivElement>
  children: (props: FeedPageContentProps) => JSX.Element
}

declare const FeedPageProvider = (props: FeedPageProviderProps) => JSX.Element

export default FeedPageProvider
