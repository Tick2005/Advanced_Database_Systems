CREATE TABLE IF NOT EXISTS pricing_requests (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
	name VARCHAR(255) NOT NULL,
	starts_on DATE NOT NULL,
	ends_on DATE NOT NULL,
	discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
	notes TEXT,
	status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
	requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
	reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
	review_note TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_pricing_request_dates CHECK (ends_on >= starts_on)
);

CREATE INDEX IF NOT EXISTS idx_pricing_requests_branch_status
	ON pricing_requests (branch_id, status, created_at DESC);
