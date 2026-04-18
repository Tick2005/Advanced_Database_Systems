const API_BASE = '/api';

const API_ENDPOINTS = {
	AUTH: `${API_BASE}/auth`,
	PUBLIC: `${API_BASE}/public`,
	CUSTOMER: `${API_BASE}/customer`,
	STAFF: `${API_BASE}/staff`,
	MANAGER: `${API_BASE}/manager`,
	OWNER: `${API_BASE}/owner`,
	INTERNAL: `${API_BASE}/internal`
};

export { API_BASE };
export default API_ENDPOINTS;
