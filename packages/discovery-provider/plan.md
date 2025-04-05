# Plan: Refactoring `entity_manager.py` for Maintainability and Scalability

**1. Introduction and Problem Statement**

The current `entity_manager.py` file is a monolithic script responsible for handling a wide range of database operations related to various entities (Users, Tracks, Playlists, Comments, etc.). This approach presents several significant challenges:

- **Poor Maintainability:** The single, large file is difficult to understand, modify, and debug. Changes in one area can easily introduce unintended consequences in another.
- **Tight Coupling:** Database interactions, event processing logic, and business rules (e.g., how to create a playlist) are all tightly intertwined, making it hard to isolate and test individual components.
- **Code Duplication:** The extensive `if/elif` structure for handling different entity types and actions leads to significant code repetition, increasing the risk of errors and inconsistencies.
- **Limited Scalability:** As the number of entity types and actions grows, the current structure will become increasingly unwieldy and difficult to scale.
- **Testing Challenges:** The lack of modularity and the tight coupling make it very difficult to write unit tests for individual parts of the system.

This plan outlines a comprehensive refactoring strategy to address these issues and create a more robust, maintainable, and scalable `entity_manager`. The goal is to achieve a 1:1 functional equivalence with the original file while significantly improving the code's structure and quality.

**2. Desired State: Modular Architecture**

The target architecture will be based on modularity and separation of concerns. We will decompose the existing `entity_manager.py` into smaller, well-defined modules with specific responsibilities. The key principles guiding this refactoring are:

- **Single Responsibility Principle (SRP):** Each module (and each function within a module) should have one, and only one, reason to change.
- **Separation of Concerns (SoC):** Different aspects of the system (data access, business logic, event handling) should be separated into distinct modules.
- **Dependency Inversion Principle (DIP):** High-level modules (like the main event processing logic) should not depend on low-level modules (like database operations). Instead, both should depend on abstractions (interfaces or base classes).
- **Don't Repeat Yourself (DRY):** Eliminate code duplication by creating reusable functions and classes.
- **Testability:** The refactored code should be easily testable, particularly through unit tests.

The desired state will be characterized by:

- **Clear Directory Structure:** A well-organized directory structure will group related modules together, making it easy to find and understand the code.
- **Independent Entity Handlers:** Each entity type (User, Track, Playlist, etc.) will have its own dedicated module responsible for handling all operations related to that entity (create, read, update, delete – CRUD).
- **Abstraction of Database Operations:** A "repository" or "data access" layer will provide a clean interface for interacting with the database, hiding the underlying SQLAlchemy implementation details.
- **Centralized Event Processing:** A dedicated module will handle the processing of `ManageEntity` events, dispatching to the appropriate entity handler based on the event's type and action.
- **Improved Error Handling:** Consistent and informative error handling will be implemented using custom exceptions.
- **Utility Modules:** Common utility functions will be grouped into separate modules to keep the core logic clean and focused.

**3. Proposed Directory Structure**

```
src/
├── tasks/
│   └── entity_manager/
│       ├── __init__.py
│       ├── entity_manager.py         (Main entry point, orchestrates updates)
│       ├── event_processor.py     (Handles event dispatching)
│       ├── repositories/            (Database interaction layer)
│       │   ├── __init__.py
│       │   ├── base_repository.py   (Common database operations, abstract class)
│       │   ├── user_repository.py
│       │   ├── track_repository.py
│       │   ├── playlist_repository.py
│       │   ├── comment_repository.py
│       │   ├── ... (other repositories - one per model, or group of related models)
│       │   └── revert_block_repository.py
│       ├── entities/               (Entity-specific business logic)
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── track.py
│       │   ├── playlist.py
│       │   ├── comment.py
│       │   ├── ... (other entities - one per major entity type)
│       └── utils.py                (Utility functions)
├── models/                       (SQLAlchemy models - existing code)
│   ├── ...
├── utils/                        (General utilities - existing code)
│   ├── ...
└── exceptions.py                (Custom exceptions)

```

**4. Detailed Refactoring Steps**

The refactoring will be performed in a phased approach to minimize disruption and ensure that the system remains functional at each stage.

**Phase 1: Foundation and Utility Extraction**

1.  **Create Directory Structure:** Set up the new directory structure as outlined above.
2.  **Move Utility Functions:** Identify and move utility functions from the original `entity_manager.py` to `src/tasks/entity_manager/utils.py`. Examples include:

    - `get_record_columns`
    - `get_entity_manager_events_tx`
    - `copy_original_records`
    - `collect_entities_to_fetch`
    - `fetch_existing_entities`
    - `create_and_raise_indexing_error`

    _Example: `src/tasks/entity_manager/utils.py`_

    ```python
    from typing import List
    from web3.types import TxReceipt
    from src.utils.config import shared_config # Example - adjust import as needed

    def get_record_columns(record) -> List[str]:
        return [str(m.key) for m in record.__table__.columns]

    def get_entity_manager_events_tx(update_task, tx_receipt: TxReceipt):
        env = shared_config.get("discprov", {}).get("env", "prod")  # Default to 'prod'
        if env == "dev":
            return [tx_receipt]
        # ... rest of the original function ...
    ```

3.  **Define Custom Exceptions:** Create `src/exceptions.py` and define custom exception classes for different error scenarios (e.g., `IndexingValidationError`, `DataAccessError`, `EntityNotFoundError`).

    _Example: `src/exceptions.py`_

    ```python
    class IndexingValidationError(Exception):
        """Error during transaction validation."""
        pass

    class DataAccessError(Exception):
        """Error during database access."""
        pass

    class EntityNotFoundError(Exception):
        """Entity not found in the database."""
        pass
    ```

**Phase 2: Repository Layer**

1.  **Create `base_repository.py`:** This file will define an abstract base class (`BaseRepository`) for all entity repositories. It will include common database operations (e.g., `get_by_id`, `add`, `delete`, `flush`) using generics to enforce type safety. This promotes DRY and provides a consistent interface.

    _Example: `src/tasks/entity_manager/repositories/base_repository.py`_

    ```python
    from sqlalchemy.orm.session import Session
    from typing import TypeVar, Generic, Type, List, Dict, Optional
    from sqlalchemy import literal_column

    T = TypeVar('T')

    class BaseRepository(Generic[T]):
        def __init__(self, session: Session, model: Type[T]):
            self.session = session
            self.model = model

        def get_by_id(self, id_value: int) -> Optional[T]:
            # Simplified example - adapt to your models' primary key
            return self.session.query(self.model).get(id_value)

        def get_by_ids(self, id_values: List[int]) -> Dict[int, T]:
            records = (
              self.session.query(self.model, literal_column(f"row_to_json({self.model.__tablename__})"))
              .filter(self.model.id.in_(id_values))  # Assuming all models have an id column
              .filter(self.model.is_current == True)
              .all()
            )
            return {getattr(record, 'id'): record for record, _ in records} # Assuming all models have an id column

        def add(self, entity: T):
            self.session.add(entity)

        def add_all(self, entities: List[T]):
          self.session.add_all(entities)

        def delete(self, entity: T):
            self.session.delete(entity)

        def flush(self):
            self.session.flush()
    ```

2.  **Create Entity-Specific Repositories:** Create individual repository files for each entity (e.g., `user_repository.py`, `track_repository.py`). Each repository will inherit from `BaseRepository` and implement entity-specific database operations.

    _Example: `src/tasks/entity_manager/repositories/user_repository.py`_

    ```python
    from sqlalchemy.orm.session import Session
    from src.models.users.user import User
    from .base_repository import BaseRepository

    class UserRepository(BaseRepository[User]):
        def __init__(self, session: Session):
            super().__init__(session, User)

        # Add User-specific methods (get_by_wallet, etc. as needed)
        def get_by_wallet(self, wallet: str) -> User | None:
            return self.session.query(User).filter(User.wallet == wallet).first()

    ```

**Phase 3: Entity Handlers**

1.  **Create Entity Handler Modules:** Create separate modules (files) within the `src/tasks/entity_manager/entities/` directory for each major entity type (e.g., `user.py`, `track.py`, `playlist.py`). These modules will contain functions for handling the business logic related to creating, updating, deleting, and (potentially) fetching that entity. These functions will take a `ManageEntityParameters` object (or a simplified version) as input and interact with the database _exclusively_ through the corresponding repository.

    _Example: `src/tasks/entity_manager/entities/user.py`_

    ```python
    from src.tasks.entity_manager.repositories.user_repository import UserRepository
    from src.tasks.entity_manager.utils import ManageEntityParameters
    from src.models.users.user import User  # Your SQLAlchemy User model
    from src.exceptions import DataAccessError  # Import your custom exceptions
    from typing import Dict

    def create_user(params: ManageEntityParameters, cid_type: Dict[str, str], cid_metadata: Dict[str, Dict]):
        user_repository = UserRepository(params.session)  # Use the repository
        user_id = params.event_args["_entityId"]
        metadata = params.event_args["_metadata"]
        # ... parse metadata ...
        new_user = User(user_id=user_id) #, ... other fields from metadata ...)
        user_repository.add(new_user)  # Use the repository to add
        params.new_records["User"][user_id].append(new_user) # type: ignore

    def update_user(params: ManageEntityParameters, cid_type: Dict[str, str], cid_metadata: Dict[str, Dict]):
        user_repository = UserRepository(params.session)
        user_id = params.event_args["_entityId"]

        existing_user = params.existing_records.get("User", {}).get(user_id)
        if existing_user is None:
          # handle user not found
          pass
        metadata = params.event_args["_metadata"]

        # Update the user
        new_user = User(
          user_id=existing_user.user_id
          # ... other fields from metadata ...
        )
        user_repository.add(new_user)
        params.new_records["User"][user_id].append(new_user) # type: ignore

    # ... other functions (update_user, delete_user, etc.) ...
    ```

**Phase 4: Event Processor**

1.  **Create `event_processor.py`:** This module will be responsible for receiving `ManageEntity` events, determining the appropriate entity handler based on the event type and action, and calling the corresponding handler function. This replaces the large `if/elif` chain in the original code.

    _Example: `src/tasks/entity_manager/event_processor.py`_

    ```python
    from src.tasks.entity_manager.utils import ManageEntityParameters, Action, EntityType
    from src.tasks.entity_manager.entities import user, track, playlist  # Import entity handlers
    from typing import Dict

    class EventProcessor:
        def __init__(self):
            self.entity_handlers = {
                (EntityType.USER, Action.CREATE): user.create_user,
                (EntityType.USER, Action.UPDATE): user.update_user,
                (EntityType.TRACK, Action.CREATE): track.create_track,
                (EntityType.PLAYLIST, Action.CREATE): playlist.create_playlist,
                # ... add all other mappings ...
            }

        def process_event(self, params: ManageEntityParameters, cid_type: Dict[str, str], cid_metadata: Dict[str, Dict]):
            handler = self.entity_handlers.get((params.entity_type, params.action))
            if handler:
                handler(params, cid_type, cid_metadata)  # Call the handler
            else:
                # Log a warning or raise an exception for unhandled events
                print(f"Warning: No handler found for {params.entity_type}, {params.action}")

    ```

**Phase 5: Refactor `entity_manager.py`**

1.  **Refactor `entity_manager_update`:** The main `entity_manager_update` function in `src/tasks/entity_manager/entity_manager.py` will now be significantly simplified. It will:

    - Initialize an `EventProcessor`.
    - Call `collect_entities_to_fetch` (from `utils.py`).
    - Call `fetch_existing_entities` (from `utils.py`).
    - Iterate through the `entity_manager_txs`.
    - For each event, create a `ManageEntityParameters` object.
    - Call `event_processor.process_event(params)` to handle the event.
    - Call a refactored `save_new_records` function (which will now use repositories)
    - Handle any remaining top-level error handling and metrics.
    - The large, nested `if/elif` block will be _completely removed_.

    _Example: (Simplified) `src/tasks/entity_manager/entity_manager.py`_

    ```python
    # ... imports ...
    from src.tasks.entity_manager.event_processor import EventProcessor
    from src.tasks.entity_manager.utils import (
      collect_entities_to_fetch,
      fetch_existing_entities,
      get_entity_manager_events_tx,
      copy_original_records
    )

    def entity_manager_update(
        update_task: DatabaseTask,
        session: Session,
        entity_manager_txs: List[TxReceipt],
        block_number: int,
        block_timestamp: int,
        block_hash: str,
    ) -> Tuple[int, Dict[str, Set[int]]]:

      try:
        # ... initialization ...
        event_processor = EventProcessor()
        entities_to_fetch = collect_entities_to_fetch(update_task, entity_manager_txs)
        existing_records, existing_records_in_json = fetch_existing_entities(session, entities_to_fetch)
        original_records = copy_original_records(existing_records)

        new_records: RecordDict = cast(
            RecordDict, defaultdict(lambda: defaultdict(list))
        )
        pending_track_routes: List = []  # Replace with your TrackRoute model
        pending_playlist_routes: List = []  # Replace with your PlaylistRoute model
        cid_type: Dict[str, str] = {}
        cid_metadata: Dict[str, Dict] = {}


        for tx_receipt in entity_manager_txs:
          txhash = update_task.web3.to_hex(tx_receipt["transactionHash"])
          entity_manager_event_tx = get_entity_manager_events_tx(update_task, tx_receipt)
          for event in entity_manager_event_tx:
            try:
              params = ManageEntityParameters(
                  session,
                  update_task.redis,
                  update_task.challenge_event_bus,
                  event,
                  new_records,
                  existing_records,
                  pending_track_routes,
                  pending_playlist_routes,
                  update_task.eth_manager,
                  update_task.web3,
                  update_task.solana_client_manager,
                  block_timestamp,
                  block_number,
                  block_hash,
                  txhash,
                  logger,
              )
              reset_entity_manager_event_tx_context(logger, event["args"])
              event_processor.process_event(params, cid_type, cid_metadata) # Process each event.
            except IndexingValidationError as e:
              logger.error(f"failed to process transaction error {e}")
            except Exception as e:
              # error handling here

        save_new_records(
          block_timestamp,
          block_number,
          new_records,
          original_records,
          existing_records_in_json,
          session,
        )
        # ... metrics and other post-processing ...
      except Exception as e:
        # Top level error handling
        pass

      return num_total_changes, changed_entity_ids

    def save_new_records(block_timestamp, block_number, new_records, original_records, existing_records_in_json, session):
      revert_block_repository = RevertBlockRepository(session) # Use repository
      # logic from original file, using the repositories, not direct session operations

    ```

2.  **Refactor `fetch_existing_entities`:** This function in `utils.py` will be updated to use the appropriate repositories instead of direct SQLAlchemy queries. This significantly simplifies the logic and makes it more maintainable. Each query will be replaced by a call to the relevant repository method.

3.  **Refactor `collect_entities_to_fetch`:** Similar to `fetch_existing_entities`, this `utils.py` function will be simplified, although its core logic remains the same.

**Phase 6: Testing and Cleanup**

1.  **Write Unit Tests:** After each phase (especially after creating repositories and entity handlers), write thorough unit tests. Mock the repository layer to isolate and test the business logic in the entity handlers. Mock the entity handlers to test the `EventProcessor`.
2.  **Integration Tests:** Write integration tests to verify that the entire system works correctly end-to-end.
3.  **Code Review:** Conduct thorough code reviews to ensure code quality, consistency, and adherence to the refactoring plan.
4.  **Remove Original Code:** Once you are confident that the refactored code is working correctly and has adequate test coverage, remove the original code from `entity_manager.py`.

**5. Benefits of the Refactored Code**

- **Improved Readability and Maintainability:** The code will be much easier to understand, modify, and debug.
- **Reduced Code Duplication:** The use of repositories and a central event processor will eliminate the need for repetitive code.
- **Increased Testability:** The modular design will make it much easier to write unit tests for individual components.
- **Enhanced Scalability:** The system will be better equipped to handle future growth and changes.
- **Easier Collaboration:** The clear separation of concerns will make it easier for multiple developers to work on the codebase simultaneously.
- **Potential for Database Changes:** The repository layer provides an abstraction that makes it easier to switch to a different database system in the future, if needed.

**6. Risks and Mitigation Strategies**

- **Introduction of Bugs:** Refactoring always carries the risk of introducing new bugs.
  - **Mitigation:** Phased approach, thorough testing (unit and integration), code reviews.
- **Performance Degradation:** Poorly implemented refactoring can lead to performance issues.
  - **Mitigation:** Careful design of repositories, performance profiling, and optimization.
- **Time Investment:** Refactoring is a significant time investment.
  - **Mitigation:** Phased approach, prioritize the most critical areas first.

**7. Conclusion**

This refactoring plan provides a roadmap for transforming the monolithic `entity_manager.py` into a well-structured, maintainable, and scalable system. By following the principles of modularity, separation of concerns, and testability, we can significantly improve the quality and long-term viability of the codebase. The phased approach, combined with thorough testing and code reviews, will help to mitigate the risks associated with this major refactoring effort. This detailed plan ensures that the transition to a better architecture happens smoothly, methodically, and effectively.
