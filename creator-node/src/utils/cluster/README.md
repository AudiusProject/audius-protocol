## Overview
[NodeJS Cluster](https://nodejs.org/api/cluster.html) allows us to use a multi-core machine more efficiently by creating multiple worker processes that each run the same Express app in parallel (no shared memory). A worker can be:
* The special worker (determined by `require('./clusterUtilsForWorker').isThisWorkerSpecial()`): used for tasks that only a single worker should perform. For example, we don't want 16 workers all running the same callback logic for Bull Queue events, so we have only the special worker listen for events.
* The first worker (determined by `require('./clusterUtilsForWorker').isThisWorkerFirst()`): used for one-time init tasks that should only happen once. For example, we only want to clear a Bull Queue once when the first worker is spawned. Otherwise we'd have the first worker clear it and start processing jobs, but then the 2nd, 3rd, and Nth workers would all clear the queues that contain jobs that other workers are already processing.

## Details
* There's a primary process (see clusterUtilsForPrimary) and 1 or more worker processes (see clusterUtilsForWorker)
* The primary and workers communicate through inter-process communication (IPC) by sending plain messages to each other ("plain" because there's no shared memory between them)
* Cluster is disabled for automated tests because we don't want to spawn a primary and multiple workers each time. It should be disabled when using a debugger (otherwise the debugger doesn't know which process to attach to) by setting `clusterModeEnabled` to `false`
* `isThisWorkerSpecial()` works by tracking the process ID. If the special worker dies for any reason, another worker's process ID is marked as the special worker so we ensure that there's always a special worker