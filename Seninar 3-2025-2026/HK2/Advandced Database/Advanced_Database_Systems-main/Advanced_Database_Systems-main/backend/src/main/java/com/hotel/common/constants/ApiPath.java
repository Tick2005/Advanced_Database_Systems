// commit: feat(api-path): thêm hằng số SEED cho endpoint khởi tạo dữ liệu mẫu
package com.hotel.common.constants;

public final class ApiPath {

	public static final String API = "/api";
	public static final String AUTH = API + "/auth";
	public static final String PUBLIC = API + "/public";
	public static final String CUSTOMER = API + "/customer";
	public static final String STAFF = API + "/staff";
	public static final String MANAGER = API + "/manager";
	public static final String OWNER = API + "/owner";
	public static final String INTERNAL = API + "/internal";
	/** Internal-only endpoint for initialising demo / test data. */
	public static final String SEED = INTERNAL + "/seed";

	private ApiPath() {
	}
}
