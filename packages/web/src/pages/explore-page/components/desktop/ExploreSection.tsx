import React, { forwardRef } from 'react'

import { Carousel, CarouselProps } from './Carousel'

type ExploreSectionProps = Pick<CarouselProps, 'title' | 'viewAllLink'> & {
  children: React.ReactNode
}

export const ExploreSection = forwardRef<HTMLDivElement, ExploreSectionProps>(
  ({ title, viewAllLink, children }, ref) => {
    return (
      <Carousel ref={ref} title={title} viewAllLink={viewAllLink}>
        {children}
      </Carousel>
    )
  }
)
