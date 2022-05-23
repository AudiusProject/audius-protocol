declare module 'promisify' {
  export default function <ArgType, ResultType>(
    fn: (
      ...args: [
        ...ArgType,
        cb: (error: Error | null, result: ResultType) => void
      ]
    ) => void
  ): (...args: ArgType) => Promise<ResultType>
}
