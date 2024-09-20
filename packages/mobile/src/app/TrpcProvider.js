import React, { useMemo, useState } from 'react';
import { createAudiusTrpcClient, trpc } from '@audius/common/services';
import { accountSelectors } from '@audius/common/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { env } from 'app/env';
export var AudiusTrpcProvider = function (_a) {
    var children = _a.children;
    var currentUserId = useSelector(accountSelectors.getUserId);
    var queryClient = useState(function () { return new QueryClient(); })[0];
    var trpcClient = useMemo(function () { return createAudiusTrpcClient(currentUserId, env.TRPC_ENDPOINT); }, [currentUserId]);
    return (<trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>);
};
