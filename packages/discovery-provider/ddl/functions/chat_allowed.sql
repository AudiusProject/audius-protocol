CREATE OR REPLACE FUNCTION chat_allowed(from_user_id int, to_user_id int) RETURNS BOOLEAN AS $$
DECLARE
  can_message BOOLEAN;
  permission_row chat_permissions%ROWTYPE;
BEGIN

  -- explicit block
  IF EXISTS (
    SELECT 1
    FROM chat_blocked_users
    WHERE
      -- don't allow blockee to message blocker
      (blocker_user_id = to_user_id AND blockee_user_id = from_user_id)
      -- also don't allower blocker to message blockee (prohibit one way send)
      OR (blocker_user_id = from_user_id AND blockee_user_id = to_user_id)
  ) THEN
    RETURN FALSE;
  END IF;

  -- no permissions set... assume ok
  SELECT COUNT(*) = 0 INTO can_message
  FROM chat_permissions
  WHERE user_id = to_user_id;

  IF can_message THEN
    RETURN TRUE;
  END IF;

  -- existing chat takes priority over permissions
  SELECT COUNT(*) > 0 INTO can_message
  FROM chat_member member_a
  JOIN chat_member member_b USING (chat_id)
  JOIN chat_message USING (chat_id)
  WHERE member_a.user_id = from_user_id
    AND member_b.user_id = to_user_id
    AND (member_b.cleared_history_at IS NULL OR chat_message.created_at > member_b.cleared_history_at)
  ;

  IF can_message THEN
    RETURN TRUE;
  END IF;


  -- check permissions in turn:
  FOR permission_row IN select * from chat_permissions WHERE user_id = to_user_id AND allowed = TRUE
  LOOP
    CASE permission_row.permits

      WHEN 'followees' THEN
        IF EXISTS (
          SELECT 1
          FROM follows
          WHERE followee_user_id = from_user_id
          AND follower_user_id = to_user_id
          AND is_delete = false
        ) THEN
          RETURN TRUE;
        END IF;

      WHEN 'followers' THEN
        IF EXISTS (
          SELECT 1
          FROM follows
          WHERE follower_user_id = from_user_id
          AND followee_user_id = to_user_id
          AND is_delete = false
        ) THEN
          RETURN TRUE;
        END IF;

      WHEN 'tippees' THEN
        IF EXISTS (
          SELECT 1
          FROM aggregate_user_tips tip
          WHERE receiver_user_id = from_user_id
          AND sender_user_id = to_user_id
        ) THEN
          RETURN TRUE;
        END IF;

      WHEN 'tippers' THEN
        IF EXISTS (
          SELECT 1
          FROM aggregate_user_tips tip
          WHERE receiver_user_id = to_user_id
          AND sender_user_id = from_user_id
        ) THEN
          RETURN TRUE;
        END IF;

      WHEN 'verified' THEN
        IF EXISTS (
          SELECT 1 FROM USERS WHERE user_id = from_user_id AND is_verified = TRUE
        ) THEN
          RETURN TRUE;
        END IF;

      WHEN 'none' THEN
        RETURN FALSE;

      WHEN 'all' THEN
        RETURN TRUE;

      ELSE
        RAISE WARNING 'unknown permits: %s', permission_row.permits;
    END CASE;
  END LOOP;

  RETURN FALSE;

END;
$$ LANGUAGE plpgsql;
