import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import optimizely, { Client } from "@optimizely/optimizely-sdk";
import { useEnvVars } from "../providers/EnvVarsProvider";
import { FeatureFlags } from "../utils/constants";

type FlagDefaults = Record<FeatureFlags, boolean>
const flagDefaults: FlagDefaults = {
  [FeatureFlags.DDEX_UPLOADS]: false,
}

export const FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY = 'featureFlagSessionId-2'

type RemoteConfigContextType = {
  didInit: boolean;
  getFeatureEnabled: ({ flag, userId }: { flag: FeatureFlags; userId?: number | undefined; }) => boolean;
};

const RemoteConfigContext = createContext<RemoteConfigContextType>({
  didInit: false,
  getFeatureEnabled: () => false,
});

export const RemoteConfigProvider = ({ children }: { children: ReactNode }) => {
  const [didInit, setDidInit] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const { optimizelySdkKey } = useEnvVars();

  const createOptimizelyClient = () => {
    optimizely.setLogLevel('warn');
    return optimizely.createInstance({
      sdkKey: optimizelySdkKey || "MX4fYBgANQetvmBXGpuxzF",
      datafileOptions: {
        autoUpdate: true,
        updateInterval: 5000 // Poll for updates every 5s
      },
      errorHandler: {
        handleError: (error: any) => {
          console.error(error);
        }
      }
    })
  }

  const getFeatureFlagSessionId = () => {
    const item = window.localStorage.getItem(
      FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY
    );
    return item ? parseInt(item) : null;
  }

  const setFeatureFlagSessionId = (id: number) => {
    window.localStorage?.setItem(
      FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY,
      id.toString()
    );
  }

  const generateSessionId = () => {
    return Math.floor(Math.random() * Number.MIN_SAFE_INTEGER)
  }

  const init = async () => {
    // Set sessionId for feature flag bucketing
    const savedSessionId = getFeatureFlagSessionId()
    if (!savedSessionId) {
      const newSessionId = generateSessionId()
      setFeatureFlagSessionId(newSessionId)
      setId(newSessionId)
    } else {
      setId(savedSessionId)
    }
    if (didInit) {
      return;
    }

    const opClient = createOptimizelyClient()

    if (opClient) {
      try {
        await opClient!.onReady();
        setDidInit(true);
        setClient(opClient);
      } catch (error) {
        console.error('Error initializing Optimizely:', error);
      }
    }
  }

  // API

  /**
   * Gets whether a given feature flag is enabled.
   */
  const getFeatureEnabled = ({ flag, userId }: {
    flag: FeatureFlags;
    userId?: number;
  }): boolean => {
    const defaultVal = flagDefaults[flag]

    // If the client is not ready yet, return early with `null`
    if (!client || (!id && !userId)) return defaultVal

    const isFeatureEnabled = ({ flag, userId }: { flag: FeatureFlags; userId?: number; }) => {
      if (!client) {
        return defaultVal
      }

      return client.isFeatureEnabled(flag, userId ? userId.toString() : id!.toString(), {
        userId: userId || id,
      })
    }

    try {
      if (didInit) {
        return (
          isFeatureEnabled({ flag, userId })
        )
      }
      return defaultVal
    } catch (err) {
      return defaultVal
    }
  }

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextValue = {
    didInit,
    getFeatureEnabled,
  };
  return (
    <RemoteConfigContext.Provider value={contextValue}>
      {children}
    </RemoteConfigContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRemoteConfig = () => useContext(RemoteConfigContext);
