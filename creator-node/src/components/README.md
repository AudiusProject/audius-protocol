# Component Pattern

We are moving the Content Node codebase to a component + service pattern. Here's a short explanation to ensure consistency moving forward. The purpose of moving to this pattern is to ensure separation of concerns between application and business logic.

A **ComponentService** contains **Components** for business logic related code and never touches any application / routing logic. This allows for easy unit testing of all **Components**.

A **Controller** is responsible for tying **Components** to application logic.

A **Router** is responsible for tying **Controllers** to Express API Routes.

Note - Any cross-component or non-router-based logic lives in a Service, which lives in the ServiceRegistry. Legacy modules like `dbManager` and `ffmpeg.js` will eventually be refactored into this format.

---

## Example

* `/components` - Contains all ComponentServices
  * `/components/healthCheck` - Contains all health check ComponentServices
    * `/components/healthCheck/healthCheckComponentService.js` - Contains all Components related to health check
    * `/components/healthCheck/healthCheckComponentService.test.js` - Contains unit tests for every Component in the HealthCheckComponentService
    * `/components/healthCheck/syncHealthCheckComponentService.js` - Contains all Components related to sync health check
    * `/components/healthCheck/syncHealthCheckComponentService.test.js` - Contains unit tests for every Component in the SyncHealthCheckComponentService
    * `/components/healthCheck/healthCheckController.js` - Connects all health check Components to health check Controllers and connects all health check Controllers to health check Routes
      * NOTE - in future, this might be refactored to move Routes logic out