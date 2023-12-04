export type AntiAbuseConfig = {
  antiAbuseOracleUrl: string;
  allowRules: Set<number>;
  blockRelayAbuseErrorCodes: Set<number>;
  blockNotificationsErrorCodes: Set<number>;
  blockEmailsErrorCodes: Set<number>;
  useAao: boolean;
};

export const newAntiAbuseConfig = (
  url: string,
  useAao: boolean
): AntiAbuseConfig => {
  return {
    antiAbuseOracleUrl: url,
    allowRules: new Set([-17, -18]),
    blockRelayAbuseErrorCodes: new Set([0, 8, 10, 13, 15, 18]),
    blockNotificationsErrorCodes: new Set([7, 9]),
    blockEmailsErrorCodes: new Set([0, 1, 2, 3, 4, 8, 10, 13, 15]),
    useAao,
  };
};

export const allowListPublicKeys = (): string[] => {
  const allowlistPublicKeyFromRelay = process.env.allowlistPublicKeyFromRelay;
  if (allowlistPublicKeyFromRelay === undefined) return [];
  return allowlistPublicKeyFromRelay.split(",");
};

export const blockListPublicKeys = (): string[] => {
  const blocklistPublicKeyFromRelay = process.env.blocklistPublicKeyFromRelay;
  if (blocklistPublicKeyFromRelay === undefined) return [];
  return blocklistPublicKeyFromRelay.split(",");
};
