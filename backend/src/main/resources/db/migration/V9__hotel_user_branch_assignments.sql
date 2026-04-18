CREATE TABLE IF NOT EXISTS user_branch_assignments (
	user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_branch_assignments_branch_id
	ON user_branch_assignments (branch_id);

INSERT INTO user_branch_assignments (user_id, branch_id)
VALUES
	('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555551'),
	('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555551')
ON CONFLICT (user_id) DO UPDATE
SET branch_id = EXCLUDED.branch_id,
	updated_at = NOW();
