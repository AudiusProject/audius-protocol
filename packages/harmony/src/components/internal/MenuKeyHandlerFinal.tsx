export {}
// import {
//   RefObject,
//   useState,
//   useEffect,
//   Children,
//   cloneElement,
//   useRef
// } from 'react'

// type MenuKeyHandlerProps = {
//   disabled?: boolean
//   onChangeIndex: (index: number | null) => void
//   children: JSX.Element[]
//   scrollRef: RefObject<HTMLDivElement>
// }

// export const MenuKeyHandler = (props: MenuKeyHandlerProps) => {
//   const { disabled, children, onChangeIndex, optionRefs, scrollRef } = props
//   const menuItemRefs = useRef<HTMLButtonElement[]>([])
//   const menuItems = Children.toArray(children)
//   const [activeIndex, setActiveIndex] = useState<number | null>(null)

//   useEffect(() => {
//     const adjustScrollPosition = (newIndex: number | null) => {
//       if (newIndex !== null) {
//         if (optionRefs.current) {
//           optionRefs.current[newIndex].scrollIntoView({
//             behavior: 'smooth',
//             block: 'start'
//           })
//         }
//       } else {
//         scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
//       }
//     }

//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (disabled) {
//         return
//       }

//       switch (event.key) {
//         case 'ArrowUp':
//           event.stopPropagation()
//           event.preventDefault()
//           setActiveIndex((prevIndex) => {
//             const getNewIndex = () => {
//               if (prevIndex === null) {
//                 return menuItems.length - 1
//               }

//               return prevIndex > 0 ? prevIndex - 1 : null
//             }

//             const newIndex = getNewIndex()
//             adjustScrollPosition(newIndex)

//             return newIndex
//           })
//           break
//         case 'ArrowDown':
//           event.stopPropagation()
//           event.preventDefault()
//           setActiveIndex((prevIndex) => {
//             const getNewIndex = () => {
//               if (prevIndex === null) {
//                 return 0
//               }

//               return prevIndex < menuItems.length - 1 ? prevIndex + 1 : null
//             }

//             const newIndex = getNewIndex()
//             adjustScrollPosition(newIndex)

//             return newIndex
//           })
//           break
//         case 'Enter':
//           event.stopPropagation()
//           event.preventDefault()
//           if (activeIndex !== null && menuItems[activeIndex]) {
//             onChangeIndex(activeIndex)
//           }
//           break
//         default:
//           break
//       }
//     }

//     window.addEventListener('keydown', handleKeyDown)

//     return () => {
//       window.removeEventListener('keydown', handleKeyDown)
//     }
//   }, [disabled, menuItems, activeIndex, scrollRef, optionRefs, onChangeIndex])

//   return (
//     <>
//       {Children.map(children, (child, index) =>
//         cloneElement(child, {
//           isActive: activeIndex === index,
//           ref: (el: HTMLButtonElement | null) => {
//             if (el) {
//               menuItemRefs.current[index] = el
//             }
//           }
//         })
//       )}
//     </>
//   )
// }
