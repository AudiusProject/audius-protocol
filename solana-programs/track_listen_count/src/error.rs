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
pub enum ProgramTemplateError {
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
impl From<ProgramTemplateError> for ProgramError {
    fn from(e: ProgramTemplateError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
impl<T> DecodeError<T> for ProgramTemplateError {
    fn type_of() -> &'static str {
        "ProgramTemplateError"
    }
}

impl PrintProgramError for ProgramTemplateError {
    fn print<E>(&self)
    where
        E: 'static + std::error::Error + DecodeError<E> + PrintProgramError + FromPrimitive,
    {
        match self {
            ProgramTemplateError::InstructionUnpackError => msg!("Instruction unpack error"),
            ProgramTemplateError::InvalidTrackData => msg!("Invalid track data were passed"),
            ProgramTemplateError::InvalidTimestamp => msg!("Difference between timestamp and current time is too big"),
        }
    }
}
