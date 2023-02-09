# Weather Map

Exposes UI at the `/storage/weather/` endpoint for a bird's eye view of the storage network and troubleshooting.

## Dev

### Running the project

- Just run `yarn dev` from this directory, and hot reloading will work at http://localhost:5173/storage/weather/
- This UI is also embedded into each Storage Node Docker container, so you can alternatively visit /storage/weather/ from any Storage Node. However, changes won't reflect there until you rebuild the whole Docker container, which is why `yarn dev` and opening the UI from the separate 5173 port is the preferred way to make code changes.
- **(Important)** Before committing changes, rebuild (`yarn build` from this directory or `make build.weathermap` from the parent comms directory) and commit the dist folder. The Docker images use your pre-built dist folder to avoid having to install yarn and build each time.

### Opening the project

- Make sure you have the VSCode ESLint plugin installed
- File > Open Workspace from File. Then select the `weather-map.code-workspace` file
- ESLint and Prettier should work out of the box. Dev away!
