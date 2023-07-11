/// async in case we need to make a db call
const isInvalidTransaction = async (encodedABI: string): Promise<boolean> => {
    // TODO: decode and validate against zod params
    // TODO: maybe check transactions table? this is no longer possible with the way identity works
    // TODO: filter replica set updates
    // if (failed) throw new Error("validation failed")
    return true
}
