from typing import Literal

# These are the different types of content that can be made premium.
# For now, we only support tracks.
PremiumContentType = Literal["track"]

# These are the different conditions on which premium content access
# will be gated.
# They should match the PremiumConditions property in the track schema
# in src/schemas/track_schema.json
PremiumContentConditions = Literal["nft-collection"]

# This is for when we support the combination of different conditions
# for premium content access based on AND'ing / OR'ing them together.
PremiumContentConditionGates = Literal["AND", "OR"]
