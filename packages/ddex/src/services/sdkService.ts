export const createSdkService = () => {
  const sdkInstance: any = null; // TODO: Replace with actual Audius SDK type + initialization

  const getSdk = () => {
    if (!sdkInstance) {
      throw new Error("SDK not initialized");
    }
    return sdkInstance;
  };

  return {
    getSdk,
  };
};
