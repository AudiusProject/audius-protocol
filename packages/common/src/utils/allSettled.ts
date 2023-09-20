export const allSettled =
  // eslint-disable-next-line no-restricted-properties
  Promise.allSettled.bind(Promise) ||
  ((promises: any[]) =>
    Promise.all(
      promises.map((p: Promise<any>) =>
        p
          .then((value: any) => ({
            status: 'fulfilled',
            value
          }))
          .catch((reason: any) => ({
            status: 'rejected',
            reason
          }))
      )
    ))
