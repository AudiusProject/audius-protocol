declare module '*.svg' {
  import type * as React from 'react'

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >

  const src: string
  export default src
}

declare module 'antd/lib/popover'
declare module 'classnames/types' {
  export type ClassValue = any
}
