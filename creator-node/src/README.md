All `creator-node` code should adhere to the below structure to ensure separation of concerns.

---

All modules in `creator-node/src` are separated into **Routes** and **Services**, and live in `routes/` and `services/`.
- `routes/` contains all modules that tie to an express http route eg `/health_check`. Each `route` follows the below structure:
  - Single `Controller.js` module
  - `components/` dir, containing modules for each route or set of routes, along with corresponding test files
- `services/` contains all other modules i.e. modules that don't tie to an express http route
  - Each service should be registered in and accessed from the **ServiceRegistry** (`src/ServiceRegistry.js`)


### Example

```
src/
  routes/
    healthCheck/
      healthCheckController.js
      components/
        healthCheck.js
        healthCheck.test.js
        syncHealthCheck.js
        syncHealthCheck.test.js
    <route-type>/
      <route-type>Controller.js
      components/
        <component>.js
        <component>.test.js
        ...
    ...
  services/
    dbManager.js
    diskManager.js
    <service>.js
    ...
```