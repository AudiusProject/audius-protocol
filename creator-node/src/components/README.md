# Component Pattern

We are moving the Content Node codebase to a component + service pattern. Here's a short explanation to ensure consistency moving forward. The purpose of moving to this pattern is to ensure separation of concerns between application and business logic.

A **Component** consists of a number of **ComponentServices** and a **ComponentController**.

A **ComponentService** contains business logic and never touches any application or routing logic. This allows for easy unit testing.

A **ComponentController** is responsible for typing **ComponentServices** to application logic, and also contains **Routers**, which connect application logic to Express API routing logic. (Note, in future, this may be refactored to move Routing logic out)

Note - Any cross-component or non-router-based logic lives in a Service, which lives in the ServiceRegistry. Legacy modules like `dbManager` and `ffmpeg.js` will eventually be refactored into this format.

---

## Example

* `/components` - Contains all **Components**
  * `/components/healthCheck` - Health check is one Component, comprised of **ComponentServices** and a **ComponentController**
    * `/components/healthCheck/healthCheckComponentService.js` - Contains all business logic related to health check **Component**
    * `/components/healthCheck/healthCheckComponentService.test.js` - Contains unit tests for health check **ComponentService**
    * `/components/healthCheck/syncHealthCheckComponentService.js` - Contains all business logic related to sync health check **Component**
    * `/components/healthCheck/syncHealthCheckComponentService.test.js` - Contains unit tests for sync health check **ComponentService**
    * `/components/healthCheck/healthCheckController.js` - Connects all health check **ComponentServices** to **ComponentControllers** and connects all **ComponentControllers** to **Routes**