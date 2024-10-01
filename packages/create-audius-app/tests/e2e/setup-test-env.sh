# Replace the API key in the example app with a test key

# react example
find ./examples/react/src/hooks/useSdk.ts -type f -exec sed -i.bak "s/import.meta.env.VITE_AUDIUS_API_KEY/\"$CREATE_AUDIUS_APP_TEST_API_KEY\"/g" {} \;
# cleanup
rm ./examples/react/src/hooks/useSdk.ts.bak

# react-hono example
# client
find ./examples/react-hono/src/client/hooks/useSdk.ts -type f -exec sed -i.bak "s/import.meta.env.VITE_AUDIUS_API_KEY/\"$CREATE_AUDIUS_APP_TEST_API_KEY\"/g" {} \;
# server
find ./examples/react-hono/src/index.tsx -type f -exec sed -i.bak "s/import.meta.env.VITE_AUDIUS_API_KEY/\"$CREATE_AUDIUS_APP_TEST_API_KEY\"/g" {} \;
find ./examples/react-hono/src/index.tsx -type f -exec sed -i.bak "s/import.meta.env.VITE_AUDIUS_API_SECRET/\"$CREATE_AUDIUS_APP_TEST_API_SECRET\"/g" {} \;
# cleanup
rm ./examples/react-hono/src/client/hooks/useSdk.ts.bak
rm ./examples/react-hono/src/index.tsx.bak
