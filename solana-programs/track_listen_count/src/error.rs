//! Error types

use num_derive::FromPrimitive;
use num_traits::FromPrimitive;
use solana_program::{
    decode_error::DecodeError,
    msg,
    program_error::{PrintProgramError, ProgramError},
};
use thiserror::Error;

/// Errors that may be returned by the CreateAndVerify program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum TrackListenCountError {
    /// Instruction unpack error
    #[error("Instruction unpack error")]
    InstructionUnpackError,
    /// Invalid track data were passed
    #[error("Invalid track data were passed")]
    InvalidTrackData,
    /// Difference between timestamp and current time is too big
    #[error("Difference between timestamp and current time is too big")]
    InvalidTimestamp,
}
impl From<TrackListenCountError> for ProgramError {
    fn from(e: TrackListenCountError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
impl<T> DecodeError<T> for TrackListenCountError {
    fn type_of() -> &'static str {
        "TrackListenCountError"
    }
}

impl PrintProgramError for TrackListenCountError {
    fn print<E>(&self)
    where
        E: 'static + std::error::Error + DecodeError<E> + PrintProgramError + FromPrimitive,
    {
        match self {
            TrackListenCountError::InstructionUnpackError => msg!("Instruction unpack error"),
            TrackListenCountError::InvalidTrackData => msg!("Invalid track data were passed"),
            TrackListenCountError::InvalidTimestamp => msg!("Difference between timestamp and current time is too big"),
        }
    }
}
