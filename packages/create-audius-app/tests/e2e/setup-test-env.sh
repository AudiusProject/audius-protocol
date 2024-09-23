# Replace the API key in the example app with a test key

# react example
find ./examples/react/src/App.tsx -type f -exec sed -i.bak "/import.meta.env.VITE_AUDIUS_API_KEY/,\"$CREATE_AUDIUS_APP_TEST_API_KEY\"/g" {} \;

# react-hono example
# client
find ./examples/react-hono/src/client/App.tsx -type f -exec sed -i.bak "/import.meta.env.VITE_AUDIUS_API_KEY/,\"$CREATE_AUDIUS_APP_TEST_API_KEY\"/g" {} \;
# server
find ./examples/react-hono/src/index.tsx -type f -exec sed -i.bak "/import.meta.env.VITE_AUDIUS_API_KEY/,\"$CREATE_AUDIUS_APP_TEST_API_KEY\"/g" {} \;
find ./examples/react-hono/src/index.tsx -type f -exec sed -i.bak "/import.meta.env.VITE_AUDIUS_API_SECRET/,\"$CREATE_AUDIUS_APP_TEST_API_SECRET\"/g" {} \;

rm ./examples/react/src/App.tsx.bak
