CREATE OR REPLACE PROCEDURE sp_assign_user_branch(
	p_user_id UUID,
	p_branch_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
	INSERT INTO user_branch_assignments (user_id, branch_id)
	VALUES (p_user_id, p_branch_id)
	ON CONFLICT (user_id)
	DO UPDATE SET
		branch_id = EXCLUDED.branch_id,
		updated_at = NOW();
END;
$$;
