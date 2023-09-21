/** Denotes the 3 preset amounts to show on the form, values are in cents. */
export type PayExtraAmountPresetValues = [number, number, number]

export enum PayExtraPreset {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CUSTOM = 3,
  NONE = 4
}
