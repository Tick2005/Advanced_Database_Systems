CREATE TABLE IF NOT EXISTS user_branch_assignments (
	user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_branch_assignments_branch_id
	ON user_branch_assignments (branch_id);
