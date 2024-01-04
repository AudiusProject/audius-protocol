import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AudiusLibsProvider } from "../providers/AudiusLibsProvider";
import { AudiusSdkProvider } from "../providers/AudiusSdkProvider";
import { RemoteConfigProvider } from "../providers/RemoteConfigProvider"
import App from "./App";
import Web3 from "web3";

declare global {
  interface Window {
    Web3: any;
  }
}

const AppWithProviders = () => {
  window.Web3 = Web3;

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <RemoteConfigProvider>
        <AudiusLibsProvider>
          <AudiusSdkProvider>
            <App />
          </AudiusSdkProvider>
        </AudiusLibsProvider>
      </RemoteConfigProvider>
    </QueryClientProvider>
  );
};

export default AppWithProviders;
