export const DRAG = 'DRAGNDROP/DRAG'
export const DROP = 'DRAGNDROP/DROP'

export const drag = (kind, id, isOwner, index) => ({
  type: DRAG,
  kind,
  id,
  isOwner,
  index
})

export const drop = () => ({
  type: DROP
})
