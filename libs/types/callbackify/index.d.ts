declare module 'callbackify' {
  export default function <ArgType, ResultType>(
    a: (...b: ArgType) => Promise<ResultType>
  ): (
    ...a: [...ArgType, cb: (error: Error | null, r: ResultType) => void]
  ) => void
}
