The `/src/services` folder houses all services registered in the ServiceRegistry (`src/serviceRegistry.js`).
These services are modules that contain cross-component logic.

NOTE - the majority of modules in `/src` will eventually be moved into this folder, and all services in the `ServiceRegistry` will be moved here. For example, `dbManager`, `diskManager`, etc.