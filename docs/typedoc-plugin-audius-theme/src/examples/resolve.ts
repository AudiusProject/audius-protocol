export const resolve = `
const resolveResponse = await audiusSdk.resolve<Track>({
  url: "https://audius.co/camouflybeats/hypermantra-86216",
});
const track = resolveResponse.data;
`;
