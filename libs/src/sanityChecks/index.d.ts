export class SanityChecks {
  libs: any
  options: Options

  constructor(libsInstance: any, options?: any): void
  async run(creatorNodeWhitelist: string[] | null): Promise<void>
}
