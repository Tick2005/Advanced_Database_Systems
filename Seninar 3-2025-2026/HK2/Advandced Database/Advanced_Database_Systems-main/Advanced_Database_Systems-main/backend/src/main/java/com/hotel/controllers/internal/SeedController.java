// commit: feat(seed-controller): endpoint nội bộ khởi tạo dữ liệu mẫu — idempotent, có ?force=true
package com.hotel.controllers.internal;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hotel.common.constants.ApiPath;
import com.hotel.common.enums.Role;
import com.hotel.common.enums.RoomStatus;
import com.hotel.common.response.ApiResponse;
import com.hotel.modules.branch.BranchEntity;
import com.hotel.modules.branch.BranchRepository;
import com.hotel.modules.room.RoomEntity;
import com.hotel.modules.room.RoomRepository;
import com.hotel.modules.room.RoomTypeEntity;
import com.hotel.modules.room.RoomTypeRepository;
import com.hotel.modules.user.ProfileEntity;
import com.hotel.modules.user.ProfileRepository;
import com.hotel.modules.user.UserEntity;
import com.hotel.modules.user.UserRepository;

/**
 * Internal seed controller — only active in "dev", "test", and "default" Spring profiles.
 *
 * <pre>
 * POST /api/internal/seed           # skip if data exists
 * POST /api/internal/seed?force=true # always re-seed
 * </pre>
 *
 * <p>Demo accounts created (password: {@code Demo@1234}):
 * <ul>
 *   <li>owner@hotel.local    → OWNER</li>
 *   <li>manager@hotel.local  → MANAGER</li>
 *   <li>staff@hotel.local    → STAFF</li>
 *   <li>customer@hotel.local → CUSTOMER</li>
 * </ul>
 */
@RestController
@RequestMapping(ApiPath.SEED)
@Profile({"dev", "test", "default"})
public class SeedController {

	private static final Logger LOGGER = LoggerFactory.getLogger(SeedController.class);
	private static final String DEMO_PASSWORD = "Demo@1234";

	// ── Well-known UUIDs (stable across re-seeds) ─────────────────────────────
	private static final UUID BRANCH_ID   = UUID.fromString("11111111-1111-1111-1111-111111111111");
	private static final UUID RT_ID       = UUID.fromString("22222222-2222-2222-2222-222222222222");
	private static final UUID OWNER_ID    = UUID.fromString("33333333-3333-3333-3333-333333333333");
	private static final UUID MANAGER_ID  = UUID.fromString("44444444-4444-4444-4444-444444444444");
	private static final UUID STAFF_ID    = UUID.fromString("55555555-5555-5555-5555-555555555555");
	private static final UUID CUSTOMER_ID = UUID.fromString("66666666-6666-6666-6666-666666666666");

	private final UserRepository userRepository;
	private final ProfileRepository profileRepository;
	private final BranchRepository branchRepository;
	private final RoomRepository roomRepository;
	private final RoomTypeRepository roomTypeRepository;
	private final PasswordEncoder passwordEncoder;

	public SeedController(
			UserRepository userRepository,
			ProfileRepository profileRepository,
			BranchRepository branchRepository,
			RoomRepository roomRepository,
			RoomTypeRepository roomTypeRepository,
			PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.profileRepository = profileRepository;
		this.branchRepository = branchRepository;
		this.roomRepository = roomRepository;
		this.roomTypeRepository = roomTypeRepository;
		this.passwordEncoder = passwordEncoder;
	}

	// ── Endpoint ──────────────────────────────────────────────────────────────

	@PostMapping
	public ApiResponse<Map<String, Object>> seed(
			@RequestParam(value = "force", defaultValue = "false") boolean force) {

		if (!force && userRepository.findByEmail("owner@hotel.local").isPresent()) {
			LOGGER.info("[Seed] Demo data already present — skipping (use ?force=true to re-seed).");
			return ApiResponse.ok("Demo data already exists. Use ?force=true to re-seed.", buildSummary(0));
		}

		int count = 0;

		// Branch
		if (force || branchRepository.findById(BRANCH_ID).isEmpty()) {
			branchRepository.save(buildBranch());
			count++;
			LOGGER.info("[Seed] Branch seeded.");
		}

		// Room type
		if (force || roomTypeRepository.findById(RT_ID).isEmpty()) {
			roomTypeRepository.save(buildRoomType());
			count++;
			LOGGER.info("[Seed] RoomType seeded.");
		}

		// Rooms
		for (RoomEntity room : buildRooms()) {
			if (force || roomRepository.findById(room.getId()).isEmpty()) {
				roomRepository.save(room);
				count++;
			}
		}
		LOGGER.info("[Seed] Rooms seeded.");

		// Users + profiles
		count += seedUser(OWNER_ID,    "owner@hotel.local",    Role.OWNER,    "Owner Demo");
		count += seedUser(MANAGER_ID,  "manager@hotel.local",  Role.MANAGER,  "Manager Demo");
		count += seedUser(STAFF_ID,    "staff@hotel.local",    Role.STAFF,    "Staff Demo");
		count += seedUser(CUSTOMER_ID, "customer@hotel.local", Role.CUSTOMER, "Customer Demo");

		LOGGER.info("[Seed] Complete — {} records written.", count);
		return ApiResponse.ok("Seed completed successfully.", buildSummary(count));
	}

	// ── Entity builders ───────────────────────────────────────────────────────

	private BranchEntity buildBranch() {
		BranchEntity b = new BranchEntity();
		b.setId(BRANCH_ID);
		b.setCode("HN-MAIN");
		b.setName("LuxStay Hà Nội — Chi nhánh chính");
		b.setCountry("Vietnam");
		b.setCity("Hà Nội");
		b.setAddress("12 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội");
		b.setPhone("+84 24 1234 5678");
		b.setEmail("hanoi@luxstay.vn");
		b.setTimezone("Asia/Ho_Chi_Minh");
		b.setLatitude(21.0285);
		b.setLongitude(105.8542);
		b.setActive(true);
		LocalDateTime now = LocalDateTime.now();
		b.setCreatedAt(now);
		b.setUpdatedAt(now);
		return b;
	}

	private RoomTypeEntity buildRoomType() {
		RoomTypeEntity rt = new RoomTypeEntity();
		rt.setId(RT_ID);
		rt.setBranchId(BRANCH_ID);
		rt.setCode("DELUXE-DBL");
		rt.setName("Deluxe Double");
		rt.setBasePrice(new BigDecimal("1200000"));
		rt.setCapacity(2);
		rt.setActive(true);
		return rt;
	}

	private List<RoomEntity> buildRooms() {
		String[][] specs = {
			{"77777777-7777-7777-7777-777777777771", "101"},
			{"77777777-7777-7777-7777-777777777772", "102"},
			{"77777777-7777-7777-7777-777777777773", "201"},
		};
		LocalDateTime now = LocalDateTime.now();
		return Arrays.stream(specs).map(s -> {
			RoomEntity r = new RoomEntity();
			r.setId(UUID.fromString(s[0]));
			r.setRoomTypeId(RT_ID);
			r.setRoomNumber(s[1]);
			r.setStatus(RoomStatus.AVAILABLE);
			r.setRate(new BigDecimal("1200000"));
			r.setMaxOccupancy(2);
			r.setCreatedAt(now);
			r.setUpdatedAt(now);
			return r;
		}).toList();
	}

	// ── User seed helper ──────────────────────────────────────────────────────

	private int seedUser(UUID id, String email, Role role, String fullName) {
		UserEntity user = userRepository.findByEmail(email).orElseGet(UserEntity::new);
		boolean isNew = user.getId() == null;
		user.setId(isNew ? id : user.getId());
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
		user.setRole(role);
		user.setActive(true);
		user.setEmailVerified(true);
		LocalDateTime now = LocalDateTime.now();
		user.setCreatedAt(isNew ? now : user.getCreatedAt());
		user.setUpdatedAt(now);
		userRepository.save(user);

		ProfileEntity profile = profileRepository.findByUserId(user.getId()).orElseGet(ProfileEntity::new);
		boolean profIsNew = profile.getUserId() == null;
		profile.setUserId(user.getId());
		profile.setFullName(fullName);
		profile.setPreferredLanguage("vi");
		profile.setCreatedAt(profIsNew ? now : profile.getCreatedAt());
		profile.setUpdatedAt(now);
		profileRepository.save(profile);

		LOGGER.info("[Seed] User {} ({}) seeded.", email, role);
		return 1;
	}

	// ── Response summary ──────────────────────────────────────────────────────

	private Map<String, Object> buildSummary(int seedCount) {
		return Map.of(
			"seedCount", seedCount,
			"demoAccounts", List.of(
				accountEntry("OWNER",    "owner@hotel.local"),
				accountEntry("MANAGER",  "manager@hotel.local"),
				accountEntry("STAFF",    "staff@hotel.local"),
				accountEntry("CUSTOMER", "customer@hotel.local")
			)
		);
	}

	private Map<String, String> accountEntry(String role, String email) {
		return Map.of("role", role, "email", email, "password", DEMO_PASSWORD);
	}
}
