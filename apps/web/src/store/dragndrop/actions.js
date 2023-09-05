export const DRAG = 'DRAGNDROP/DRAG'
export const DROP = 'DRAGNDROP/DROP'

export const drag = (kind, id, isOwner) => ({
  type: DRAG,
  kind,
  id,
  isOwner
})

export const drop = () => ({
  type: DROP
})
