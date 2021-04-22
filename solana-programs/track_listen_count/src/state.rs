//! State transition types

use solana_program::clock::UnixTimestamp;
use borsh::{BorshDeserialize, BorshSerialize};

/// Track data
#[derive(BorshSerialize, BorshDeserialize, Clone)]
pub struct TrackData {
    /// user ID
    pub user_id: String,
    /// track ID
    pub track_id: String,
    /// track source
    pub source: String,
    /// timestamp as nonce
    pub timestamp: UnixTimestamp,
}
