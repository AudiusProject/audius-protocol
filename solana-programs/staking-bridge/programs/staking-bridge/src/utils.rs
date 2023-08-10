use anchor_lang::prelude::*;

pub fn yolo() -> Result<()> {
  msg!("yolo");
  Ok(())
}

pub struct Alec {
  pub name: String,
  pub age: u8,
}