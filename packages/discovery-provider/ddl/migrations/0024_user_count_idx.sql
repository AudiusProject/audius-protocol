BEGIN;
  CREATE INDEX IF NOT EXISTS ix_users_active_count
  ON "users" ("is_deactivated", "is_current", "handle_lc", "is_available")
  where
    "is_deactivated" = false
    and "is_current" = true
    and "handle_lc" is not null
    and "is_available" = true;
COMMIT;
