# Weather Map

Exposes UI at the `/storage/` endpoint for a bird's eye view of the storage network and troubleshooting.

## Dev

### Quickstart

- Run `make` from the comms/ directory, and open http://node1-storage/storage
- For the closest we get tohot reloading, run `yarn dev` from this directory. This will trigger a rebuild when you change files, and then you can view changes by refreshing http://node1-storage/storage
- **(Important)** Before committing changes, rebuild (`yarn build` from this directory or `make build.weathermap` from the parent comms directory) and commit the dist folder. The Docker images use your pre-built dist folder to avoid having to install yarn and build each time.

### Opening the project

- Make sure you have the VSCode ESLint plugin installed
- File > Open Workspace from File. Then select the `weather-map.code-workspace` file
- ESLint and Prettier should work out of the box. Dev away!
