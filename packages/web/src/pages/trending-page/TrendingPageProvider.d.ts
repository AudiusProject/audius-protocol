import { TrendingPageContentProps } from './types'

type TrendingPageProviderProps = {
  containerRef: RefObject<HTMLDivElement>
  children: (props: TrendingPageContentProps) => JSX.Element
}

declare const TrendingPageProvider = (props: TrendingPageProviderProps) =>
  JSX.Element

export default TrendingPageProvider
