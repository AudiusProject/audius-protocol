import { ScrollBarProps as PerfectScrollbarProps } from 'react-perfect-scrollbar'

export type ScrollbarProps = PerfectScrollbarProps & {
  forward?: boolean
  /**
   * Whether or not to hide the scrollbars. Useful if you are rendering
   * a scroll bar inside something that is changing sizes and you need
   * to wait for the size to be stable before showing scrollbars.
   */
  isHidden?: boolean
}
