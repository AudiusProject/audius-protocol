type Options = { skipRollover: boolean }

export class SanityChecks {
  libs: any
  options: Options

  constructor(libsInstance: any, options?: Options): void
  async run(creatorNodeWhitelist: string[] | null): Promise<void>
}
