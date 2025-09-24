/* eslint-disable @typescript-eslint/no-unused-vars */
import 'react'

// Allow legacy HTML values to support strange email clients
declare module 'react' {
  interface HTMLAttributes<T> {
    bgcolor?: string
  }
  interface TdHTMLAttributes<T> {
    bgcolor?: string
  }
  interface TableHTMLAttributes<T> {
    border?: number | string
    cellPadding?: number | string
    cellSpacing?: number | string
  }
}
