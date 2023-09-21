from typing import Optional

from sqlalchemy.sql import functions

from src.utils import helpers


def generate_slug_and_collision_id(
    session,
    model,
    record_id,
    record_title,
    record_owner_id,
    pending_routes,
    new_slug_title,
    new_slug,
):
    # Check for collisions by slug titles, and get the max collision_id
    max_collision_id: Optional[int] = None
    # Check pending updates first
    for route in pending_routes:
        if route.title_slug == new_slug_title and route.owner_id == record_owner_id:
            max_collision_id = (
                route.collision_id
                if max_collision_id is None
                else max(max_collision_id, route.collision_id)
            )

    # Check DB if necessary
    if max_collision_id is None:
        max_collision_id = (
            session.query(functions.max(model.collision_id))
            .filter(
                model.title_slug == new_slug_title,
                model.owner_id == record_owner_id,
            )
            .one_or_none()
        )[0]

    existing_route: Optional[model] = None
    # If the new track_slug ends in a digit, there's a possibility it collides
    # with an existing route when the collision_id is appended to its title_slug
    if new_slug[-1].isdigit():
        existing_route = next(
            (
                route
                for route in pending_routes
                if route.slug == new_slug and route.owner_id == record_owner_id
            ),
            None,
        )
        if existing_route is None:
            existing_route = (
                session.query(model)
                .filter(
                    model.slug == new_slug,
                    model.owner_id == record_owner_id,
                )
                .one_or_none()
            )

    new_collision_id = 0
    has_collisions = existing_route is not None

    if max_collision_id is not None:
        has_collisions = True
        new_collision_id = max_collision_id
    while has_collisions:
        # If there is an existing track by the user with that slug,
        # then we need to append the collision number to the slug
        new_collision_id += 1
        new_slug = helpers.sanitize_slug(record_title, record_id, new_collision_id)

        # Check for new collisions after making the new slug
        # In rare cases the user may have track names that end in numbers that
        # conflict with this track name when the collision id is appended,
        # for example they could be trying to create a route that conflicts
        # with the old routing (of appending -{track_id}) This is a fail safe
        # to increment the collision ID until no such collisions are present.
        #
        # Example scenario:
        #   - User uploads track titled "Track" (title_slug: 'track')
        #   - User uploads track titled "Track 1" (title_slug: 'track-1')
        #   - User uploads track titled "Track" (title_slug: 'track')
        #       - Try collision_id: 1, slug: 'track-1' and find new collision
        #       - Use collision_id: 2, slug: 'track-2'
        #   - User uploads track titled "Track" (title_slug: 'track')
        #       - Use collision_id: 3, slug: 'track-3'
        #   - User uploads track titled "Track 1" (title_slug: 'track-1')
        #       - Use collision_id: 1, slug: 'track-1-1'
        #
        # This may be expensive with many collisions, but should be rare.
        existing_route = next(
            (
                route
                for route in pending_routes
                if route.slug == new_slug and route.owner_id == record_owner_id
            ),
            None,
        )
        if existing_route is None:
            existing_route = (
                session.query(model)
                .filter(
                    model.slug == new_slug,
                    model.owner_id == record_owner_id,
                )
                .one_or_none()
            )
        has_collisions = existing_route is not None
    return new_slug, new_collision_id
