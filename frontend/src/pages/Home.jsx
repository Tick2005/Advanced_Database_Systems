import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { roomService } from "../features/rooms/roomService";
import { branchService } from "../features/branches/branchService";
import { feedbackService } from "../features/feedback/feedbackService";
import { PATHS } from "../routes/pathConstants";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import { formatCurrencyVnd } from "../services/presenters";
import { useApiQuery } from "../hooks/useApiQuery";
import { queryKeys } from "../services/queryKeys";

/* ─── STATIC DATA (fallback + enrichment) ─────────────────────────────────── */
const HERO_IMAGES = [
  "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg",
  "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
  "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg",
  "https://images.pexels.com/photos/271619/pexels-photo-271619.jpeg",
  "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg",
  "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg",
];

const ROOM_IMAGES = [
  "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
  "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg",
  "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg",
  "https://images.pexels.com/photos/271619/pexels-photo-271619.jpeg",
  "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg",
  "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg",
  "https://images.pexels.com/photos/2507007/pexels-photo-2507007.jpeg",
  "https://images.pexels.com/photos/2736388/pexels-photo-2736388.jpeg",
];

const STATIC_ROOMS = [
  { id: "s1", roomTypeName: "Suite Penthouse", branchName: "LuxStay Riverside HCM", totalRevenue: 128000000, img: ROOM_IMAGES[0], rating: 4.9, bookingCount: 312 },
  { id: "s2", roomTypeName: "Deluxe Ocean View", branchName: "LuxStay Đà Nẵng Beach", totalRevenue: 112000000, img: ROOM_IMAGES[1], rating: 4.8, bookingCount: 287 },
  { id: "s3", roomTypeName: "Executive Suite", branchName: "LuxStay Hà Nội Old Town", totalRevenue: 98000000, img: ROOM_IMAGES[2], rating: 4.7, bookingCount: 256 },
  { id: "s4", roomTypeName: "Family Premium", branchName: "LuxStay Nha Trang Pearl", totalRevenue: 87000000, img: ROOM_IMAGES[3], rating: 4.7, bookingCount: 241 },
  { id: "s5", roomTypeName: "Superior Garden", branchName: "LuxStay Phú Quốc Eden", totalRevenue: 74000000, img: ROOM_IMAGES[4], rating: 4.6, bookingCount: 219 },
  { id: "s6", roomTypeName: "Classic Standard", branchName: "LuxStay Riverside HCM", totalRevenue: 61000000, img: ROOM_IMAGES[5], rating: 4.5, bookingCount: 198 },
  { id: "s7", roomTypeName: "Duplex Loft", branchName: "LuxStay Hội An Heritage", totalRevenue: 55000000, img: ROOM_IMAGES[6], rating: 4.6, bookingCount: 187 },
  { id: "s8", roomTypeName: "Business Twin", branchName: "LuxStay Hà Nội Old Town", totalRevenue: 48000000, img: ROOM_IMAGES[7], rating: 4.4, bookingCount: 172 },
];

const STATIC_SERVICES = [
  { id: "sv1", icon: "🍳", name: "Bữa sáng buffet", desc: "Đa dạng 40+ món, phục vụ 6h–10h", price: 250000, category: "Ẩm thực" },
  { id: "sv2", icon: "🍽️", name: "Bữa tối fine dining", desc: "Menu 5 courses, tầng cao nhất", price: 850000, category: "Ẩm thực" },
  { id: "sv3", icon: "🚗", name: "Đưa đón sân bay", desc: "Xe riêng, đúng giờ, chuyên nghiệp", price: 450000, category: "Di chuyển" },
  { id: "sv4", icon: "🚌", name: "Tour thành phố", desc: "Hướng dẫn viên riêng 8h–17h", price: 650000, category: "Di chuyển" },
  { id: "sv5", icon: "🏊", name: "Hồ bơi vô cực", desc: "Tầng mái, view toàn thành phố", price: 0, category: "Tiện ích" },
  { id: "sv6", icon: "🏋️", name: "Phòng tập Gym", desc: "Thiết bị hiện đại, mở cửa 24/7", price: 0, category: "Tiện ích" },
  { id: "sv7", icon: "💆", name: "Spa & Massage", desc: "Liệu trình thư giãn toàn thân", price: 800000, category: "Chăm sóc" },
  { id: "sv8", icon: "💄", name: "Beauty salon", desc: "Chăm sóc da, tóc chuyên nghiệp", price: 350000, category: "Chăm sóc" },
  { id: "sv9", icon: "🎾", name: "Sân tennis", desc: "Đặt trước 2 tiếng, có huấn luyện viên", price: 150000, category: "Thể thao" },
  { id: "sv10", icon: "🧘", name: "Yoga & thiền định", desc: "Lớp nhóm mỗi sáng 7h–8h", price: 120000, category: "Thể thao" },
  { id: "sv11", icon: "☕", name: "Mini bar phòng", desc: "Đồ uống cao cấp bổ sung hàng ngày", price: 0, category: "Tiện ích" },
  { id: "sv12", icon: "🍸", name: "Cocktail bar tầng cao", desc: "Mở cửa 18h–24h, DJ cuối tuần", price: 180000, category: "Ẩm thực" },
  { id: "sv13", icon: "🔑", name: "Late check-out", desc: "Giữ phòng đến 16:00 chiều", price: 200000, category: "Tiện ích" },
  { id: "sv14", icon: "📦", name: "Giữ hành lý", desc: "Miễn phí 24h, kín bảo đảm", price: 0, category: "Tiện ích" },
  { id: "sv15", icon: "👶", name: "Trông trẻ", desc: "Người chăm sóc được đào tạo", price: 300000, category: "Chăm sóc" },
  { id: "sv16", icon: "🐾", name: "Phòng pet-friendly", desc: "Chào đón thú cưng của bạn", price: 150000, category: "Tiện ích" },
];

const SERVICE_CATEGORIES = ["Tất cả", "Ẩm thực", "Di chuyển", "Tiện ích", "Chăm sóc", "Thể thao"];

const STATIC_REVIEWS = [
  { id: "r1", name: "Nguyễn Minh Khoa", rating: 5, date: "2025-03-12", room: "Suite Penthouse", branch: "LuxStay Riverside HCM", content: "Phòng cực kỳ sang trọng, view sông đẹp không tả được. Dịch vụ phục vụ rất chu đáo và nhanh nhẹn. Nhân viên thân thiện, luôn sẵn sàng hỗ trợ. Đây là kỳ nghỉ tuyệt vời nhất mà tôi từng trải nghiệm.", avatar: "N" },
  { id: "r2", name: "Trần Thị Thu Hà", rating: 5, date: "2025-03-08", room: "Deluxe Ocean View", branch: "LuxStay Đà Nẵng Beach", content: "Tuyệt vời! Phòng nhìn thẳng ra biển, sóng vỗ nhẹ mỗi sáng thức dậy. Buffet sáng rất phong phú và ngon. Hồ bơi view đẹp. Chắc chắn sẽ quay lại lần sau.", avatar: "T" },
  { id: "r3", name: "Lê Văn Đức", rating: 5, date: "2025-02-25", room: "Executive Suite", branch: "LuxStay Hà Nội Old Town", content: "Vị trí trung tâm phố cổ, đi bộ 5 phút là đến Hồ Gươm. Phòng rộng, nội thất cổ điển sang trọng. Nhân viên hỗ trợ đặt bàn nhà hàng rất nhiệt tình. 5 sao xứng đáng!", avatar: "L" },
  { id: "r4", name: "Phạm Thanh Lan", rating: 5, date: "2025-02-18", room: "Family Premium", branch: "LuxStay Nha Trang Pearl", content: "Gia đình tôi có 4 người, phòng Family Premium đủ rộng cho cả nhà. Bể bơi cho trẻ em rất an toàn. Khu vui chơi đầy đủ. Các bé rất thích! Sẽ quay lại vào hè này.", avatar: "P" },
  { id: "r5", name: "Hoàng Minh Tú", rating: 5, date: "2025-02-10", room: "Superior Garden", branch: "LuxStay Phú Quốc Eden", content: "Phú Quốc lần đầu nhưng không thể nào quên. View vườn nhiệt đới thực sự ấn tượng. Spa ở đây là top đầu tôi từng thử. Nhân viên massage chuyên nghiệp. Cực kỳ thư giãn!", avatar: "H" },
  { id: "r6", name: "Nguyễn Thị Bích", rating: 4, date: "2025-01-30", room: "Duplex Loft", branch: "LuxStay Hội An Heritage", content: "Phòng Duplex thiết kế rất đẹp theo phong cách Hội An truyền thống. Đêm đi phố đèn lồng về rất tuyệt. Bữa sáng ngon với các món địa phương đặc sắc. Chỉ hơi tiếc vì wifi chưa ổn định.", avatar: "N" },
  { id: "r7", name: "Đinh Tuấn Anh", rating: 5, date: "2025-01-22", room: "Suite Penthouse", branch: "LuxStay Riverside HCM", content: "Đến đây vì honeymoon và quả không phải chọn lầm. Penthouse với bồn tắm view sông Sài Gòn, thật sự lãng mạn. Hotel trang trí hoa cho chúng tôi thêm một cách rất ý nghĩa. Cảm ơn đội ngũ nhân viên!", avatar: "Đ" },
  { id: "r8", name: "Vũ Thị Mai", rating: 4, date: "2025-01-15", room: "Business Twin", branch: "LuxStay Hà Nội Old Town", content: "Đi công tác, phòng Business Twin đầy đủ tiện nghi làm việc. Bàn viết rộng, ánh sáng tốt, wifi cực nhanh. Phòng ngủ tách biệt nên yên tĩnh. Tôi sẽ chọn nơi này cho các chuyến công tác tiếp theo.", avatar: "V" },
  { id: "r9", name: "Lưu Minh Châu", rating: 5, date: "2025-01-08", room: "Classic Standard", branch: "LuxStay Riverside HCM", content: "Phòng Standard nhưng chất lượng không thua gì nhiều nơi khác tôi ở giá gấp đôi. Sạch sẽ, gọn gàng, nhân viên dọn phòng rất chu đáo. Có thể yêu cầu thêm gối, chăn — đều được đáp ứng ngay.", avatar: "L" },
  { id: "r10", name: "Trần Gia Huy", rating: 5, date: "2024-12-28", room: "Deluxe Ocean View", branch: "LuxStay Đà Nẵng Beach", content: "Kỳ nghỉ lễ cuối năm lý tưởng tại Đà Nẵng. Đón năm mới từ phòng nhìn ra biển thật đặc biệt. Pháo hoa từ cầu Rồng nhìn rõ từ ban công phòng. Cocktail bar tầng cao cũng rất đáng thử!", avatar: "T" },
];

/* ─── COMPONENT ─────────────────────────────────────────────────────────────── */
export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [roomSlideIdx, setRoomSlideIdx] = useState(0);
  const [serviceCategory, setServiceCategory] = useState("Tất cả");
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [userCity, setUserCity] = useState("");
  const [reviewIdx, setReviewIdx] = useState(true);
  const roomSliderRef = useRef(null);
  const [reviewFade, setReviewFade] = useState(true);

  // Get user location based on browser
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // In a real app, you'd use reverse geocoding API
          // For now, we'll use a simple heuristic based on coordinates
          const lat = position.coords.latitude;
          // Rough estimation: Vietnam spans roughly from 8° to 24° latitude
          if (lat > 21) {
            setUserCity("Hà Nội");
          } else if (lat > 15) {
            setUserCity("Đà Nẵng");
          } else if (lat > 10) {
            setUserCity("Nha Trang");
          } else {
            setUserCity("TP. Hồ Chí Minh");
          }
        },
        () => {
          // Default to HCM if location denied
          setUserCity("TP. Hồ Chí Minh");
        }
      );
    }
  }, []);

  /* ── Queries ── */
  const branchesQ = useApiQuery({ queryKey: queryKeys.branches, queryFn: () => branchService.getTopBranches(), staleTime: 60000 });
  const topRoomsQ = useApiQuery({ queryKey: queryKeys.topRoomTypes, queryFn: () => roomService.getTopRoomTypes(), staleTime: 60000 });
  const feedbackQ = useApiQuery({
    queryKey: ["home-fb-all"],
    queryFn: async () => {
      const rooms = await roomService.getRooms();
      const chunks = await Promise.all((rooms || []).slice(0, 8).map((r) => feedbackService.getFeedbackByRoom(r.id).catch(() => [])));
      return chunks.flatMap((c) => c || []).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
    },
    staleTime: 60000,
  });

  const branches = branchesQ.data || [];
  const topRoomsRaw = topRoomsQ.data || [];
  
  /* Enrich from DB or use static - prioritize by user location */
  const topRooms = useMemo(() => {
    const base = topRoomsRaw.length > 0
      ? topRoomsRaw.map((r, i) => ({ ...r, img: ROOM_IMAGES[i % ROOM_IMAGES.length] }))
      : STATIC_ROOMS;

    // Sort by location proximity to user, then by rating
    if (userCity) {
      const priorityCities = {
        "TP. Hồ Chí Minh": ["Hồ Chí Minh", "Sài Gòn", "Vũng Tàu", "Cần Thơ"],
        "Hà Nội": ["Hà Nội", "Hải Phòng", "Hạ Long"],
        "Đà Nẵng": ["Đà Nẵng", "Huế", "Hội An"],
        "Nha Trang": ["Nha Trang", "Phú Quốc", "Mũi Né"]
      };

      const userPriorityCities = priorityCities[userCity] || [];

      return [...base].sort((a, b) => {
        const aCity = a.branchName || a.branchCity || "";
        const bCity = b.branchName || b.branchCity || "";
        const aIdx = userPriorityCities.findIndex(city => aCity.toLowerCase().includes(city.toLowerCase()));
        const bIdx = userPriorityCities.findIndex(city => bCity.toLowerCase().includes(city.toLowerCase()));

        // Rooms in user's city first
        if (aIdx !== bIdx) {
          return aIdx === -1 ? 1 : (bIdx === -1 ? -1 : aIdx - bIdx);
        }
        // Then by rating
        return (b.rating || 0) - (a.rating || 0);
      }).slice(0, 4);
    }

    // If no user city, sort by rating and take top 4
    return [...base].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
  }, [topRoomsRaw, userCity]);

  const reviews = useMemo(() => {
    const live = feedbackQ.data || [];
    return live.length >= 6 ? live : [...live, ...STATIC_REVIEWS].slice(0, 10);
  }, [feedbackQ.data]);

  const services = useMemo(() => {
    if (serviceCategory === "Tất cả") return STATIC_SERVICES;
    return STATIC_SERVICES.filter((s) => s.category === serviceCategory);
  }, [serviceCategory]);

  /* ── Hero auto-slide with CSS opacity (no jump) ── */
  useEffect(() => {
    if (heroPaused) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_IMAGES.length), 3000);
    return () => clearInterval(t);
  }, [heroPaused]);

  /* ── Reviews auto-roll 3s (one review at a time) ── */
  useEffect(() => {
    if (reviews.length === 0) return;
    const t = setInterval(() => {
      setReviewFade(false);
      setTimeout(() => {
        setReviewIdx((i) => (i + 1) % reviews.length);
        setReviewFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(t);
  }, [reviews.length]);

  /* ── Branch init ── */
  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) setSelectedBranchId(branches[0].id);
  }, [branches, selectedBranchId]);

  /* ── Room slider scroll sync ── */
  const CARD_W = 300;
  const scrollRooms = (dir) => {
    const next = Math.max(0, Math.min(topRooms.length - 1, roomSlideIdx + dir));
    setRoomSlideIdx(next);
    if (roomSliderRef.current) {
      roomSliderRef.current.scrollTo({ left: next * (CARD_W + 16), behavior: "smooth" });
    }
  };

  if (branchesQ.isLoading || topRoomsQ.isLoading) return <LoadingState text="Đang tải trang chủ..." />;
  if (branchesQ.error) return <ErrorState message={branchesQ.error.message} onRetry={branchesQ.refetch} />;

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  return (
    <>
      {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
      <section
        style={{ position: "relative", minHeight: "88vh", overflow: "hidden", display: "flex", alignItems: "center" }}
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        {/* Background slides — CSS opacity crossfade, NOT jumping */}
        {HERO_IMAGES.map((src, i) => (
          <div key={src} style={{
            position: "absolute", inset: 0, backgroundImage: `url(${src})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: i === heroIdx ? 1 : 0,
            transition: "opacity 1.2s ease",
            zIndex: 0,
          }} />
        ))}
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(10,22,40,0.82) 0%, rgba(10,22,40,0.45) 60%, rgba(10,22,40,0.18) 100%)", zIndex: 1 }} />

        {/* Content */}
        <div className="container" style={{ position: "relative", zIndex: 2, padding: "60px 24px" }}>
          <div style={{ maxWidth: 640 }}>
            <span style={{ display: "inline-block", padding: "5px 16px", borderRadius: 99, background: "rgba(201,168,76,0.2)", border: "1px solid #c9a84c", color: "#c9a84c", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
              ✦ Luxury Hotel Platform
            </span>
            <h1 style={{ margin: "0 0 20px", fontSize: "clamp(34px,5.5vw,62px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, fontFamily: "Playfair Display, serif" }}>
              Trải nghiệm lưu trú<br />
              <span style={{ color: "#c9a84c" }}>sang trọng</span> đỉnh cao
            </h1>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 16, lineHeight: 1.7, margin: "0 0 32px", maxWidth: 520 }}>
              Đặt phòng trong 3 bước. Thanh toán an toàn. Chăm sóc khách hàng 24/7 từ đội ngũ chuyên nghiệp tại mọi chi nhánh LuxStay.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to={PATHS.ROOMS} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 20px rgba(180,130,20,0.4)" }}>
                🛏️ Tìm phòng ngay
              </Link>
              <Link to={PATHS.BRANCHES} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 24px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.35)", color: "#fff", fontWeight: 600, fontSize: 15, textDecoration: "none", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
                🏢 Xem chi nhánh
              </Link>
            </div>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 28, marginTop: 40, flexWrap: "wrap" }}>
              {[
                { val: "4.9★", label: "Đánh giá TB" },
                { val: "500+", label: "Phòng cao cấp" },
                { val: "12+", label: "Chi nhánh" },
                { val: "24/7", label: "Hỗ trợ" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontWeight: 800, fontSize: 22, color: "#c9a84c" }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide dots */}
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 3 }}>
          {HERO_IMAGES.map((_, i) => (
            <button key={i} type="button" onClick={() => setHeroIdx(i)} style={{ width: i === heroIdx ? 28 : 8, height: 8, borderRadius: 99, border: "none", background: i === heroIdx ? "#c9a84c" : "rgba(255,255,255,0.45)", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════ TOP ROOMS SLIDER ═══════════════════════ */}
      <section style={{ background: "#f8fafc", padding: "64px 0" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9a7d24", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>⭐ Được đặt nhiều nhất</div>
              <h2 style={{ margin: 0, fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, fontFamily: "Playfair Display, serif", color: "#0d2238" }}>
                Top phòng đặc sắc
              </h2>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" onClick={() => scrollRooms(-1)} disabled={roomSlideIdx === 0}
                style={{ width: 40, height: 40, borderRadius: 999, border: "1px solid #e2e8f0", background: "white", cursor: roomSlideIdx === 0 ? "not-allowed" : "pointer", fontSize: 16, opacity: roomSlideIdx === 0 ? 0.4 : 1, display: "grid", placeItems: "center" }}>←</button>
              <button type="button" onClick={() => scrollRooms(1)} disabled={roomSlideIdx >= topRooms.length - 1}
                style={{ width: 40, height: 40, borderRadius: 999, border: "1px solid #e2e8f0", background: "white", cursor: roomSlideIdx >= topRooms.length - 1 ? "not-allowed" : "pointer", fontSize: 16, opacity: roomSlideIdx >= topRooms.length - 1 ? 0.4 : 1, display: "grid", placeItems: "center" }}>→</button>
              <Link to={PATHS.ROOMS} style={{ padding: "10px 20px", borderRadius: 99, border: "1px solid #c9a84c", background: "white", color: "#9a7d24", fontWeight: 700, fontSize: 13, textDecoration: "none", marginLeft: 8 }}>
                View all →
              </Link>
            </div>
          </div>

          {/* Scrollable slider */}
          <div ref={roomSliderRef} style={{ display: "flex", gap: 16, overflowX: "auto", scrollBehavior: "smooth", paddingBottom: 12, scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {topRooms.map((room, i) => (
              <article key={room.id || i} style={{
                flexShrink: 0, width: CARD_W, borderRadius: 18, overflow: "hidden",
                background: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.14)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)"; }}
              >
                <div style={{ position: "relative", height: 190, overflow: "hidden" }}>
                  <img src={room.img || ROOM_IMAGES[i % ROOM_IMAGES.length]} alt={room.roomTypeName} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }} />
                  <div style={{ position: "absolute", top: 10, left: 10, background: "#0d2238", color: "#c9a84c", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 800 }}>
                    #{i + 1}
                  </div>
                  {room.rating && (
                    <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", color: "#fbbf24", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                      ★ {room.rating}
                    </div>
                  )}
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0d2238", marginBottom: 4 }}>{room.roomTypeName}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>📍 {room.branchName}</div>

                  {/* Star rating */}
                  <div style={{ display: "flex", gap: 2, marginBottom: 8, alignItems: "center" }}>
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} style={{ fontSize: 14, color: s <= Math.round(room.rating || 0) ? "#fbbf24" : "#e2e8f0" }}>★</span>
                    ))}
                    <span style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>
                      {room.rating ? room.rating.toFixed(1) : "Chưa có"}
                    </span>
                  </div>

                  {/* Location badge nếu cùng thành phố */}
                  {userCity && (room.branchName || "").toLowerCase().includes(userCity.split(" ").pop().toLowerCase()) && (
                    <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginBottom: 6 }}>
                      📍 Gần bạn
                    </div>
                  )}

                  <Link to={PATHS.ROOMS} style={{ display: "block", marginTop: 8, padding: "9px 0", textAlign: "center", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0d2238", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                    Xem phòng →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Dot indicators */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
            {topRooms.map((_, i) => (
              <button key={i} type="button" onClick={() => { setRoomSlideIdx(i); if (roomSliderRef.current) roomSliderRef.current.scrollTo({ left: i * (CARD_W + 16), behavior: "smooth" }); }}
                style={{ width: i === roomSlideIdx ? 24 : 8, height: 8, borderRadius: 99, border: "none", background: i === roomSlideIdx ? "#c9a84c" : "#cbd5e1", padding: 0, cursor: "pointer", transition: "all 0.25s" }} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SERVICES ═══════════════════════════════ */}
      <section style={{ padding: "64px 0", background: "#fff" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9a7d24", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>🛎️ Dịch vụ đẳng cấp</div>
            <h2 style={{ margin: 0, fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, fontFamily: "Playfair Display, serif", color: "#0d2238" }}>
              Dịch vụ được quan tâm
            </h2>
            <p style={{ color: "#64748b", marginTop: 10, maxWidth: 500, margin: "10px auto 0" }}>
              Lựa chọn và thêm dịch vụ ngay khi đặt phòng hoặc trong quá trình lưu trú
            </p>
          </div>

          {/* Category filter */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
            {SERVICE_CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => setServiceCategory(cat)}
                style={{
                  padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid",
                  borderColor: serviceCategory === cat ? "#0d2238" : "#e2e8f0",
                  background: serviceCategory === cat ? "#0d2238" : "white",
                  color: serviceCategory === cat ? "white" : "#475569",
                  transition: "all 0.15s",
                }}
              >{cat}</button>
            ))}
          </div>

          {/* Service grid */}
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))" }}>
            {services.map((svc) => (
              <article key={svc.id}
                onClick={() => setSelectedService(svc)}
                style={{
                  padding: "18px 14px", borderRadius: 16, border: "1px solid #e2e8f0", background: "white",
                  cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                  display: "grid", gap: 6,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ fontSize: 32 }}>{svc.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0d2238" }}>{svc.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{svc.category}</div>
                <div style={{ fontWeight: 800, color: svc.price === 0 ? "#16a34a" : "#9a7d24", fontSize: 13, marginTop: 4 }}>
                  {svc.price === 0 ? "Miễn phí" : formatCurrencyVnd(svc.price)}
                </div>
                <span style={{ fontSize: 11, color: "#c9a84c", fontWeight: 600 }}>Xem chi tiết →</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ REVIEWS ════════════════════════════════ */}
      <section style={{ padding: "64px 0", background: "#f8fafc" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9a7d24", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>💬 Khách hàng nói gì</div>
            <h2 style={{ margin: 0, fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, fontFamily: "Playfair Display, serif", color: "#0d2238" }}>
              Top 10 đánh giá cao nhất
            </h2>
            <p style={{ color: "#64748b", marginTop: 10 }}>Phản hồi thực từ khách hàng đã lưu trú tại LuxStay</p>
          </div>

          {/* Auto-rolling single review card */}
          <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
            <div style={{ 
              padding: "32px 36px", 
              borderRadius: 24, 
              background: "white", 
              border: "1px solid #e2e8f0", 
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              opacity: reviewFade ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}>
              {/* Quote icon */}
              <div style={{ fontSize: 48, color: "#c9a84c", marginBottom: 16, opacity: 0.3 }}>"</div>
              
              {/* Review content */}
              {reviews[reviewIdx] && (
                <>
                  <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} style={{ fontSize: 20, color: s <= (reviews[reviewIdx].rating || 0) ? "#fbbf24" : "#e2e8f0" }}>★</span>
                    ))}
                  </div>
                  <p style={{ margin: "0 0 24px", color: "#334155", fontSize: 16, lineHeight: 1.7, fontStyle: "italic" }}>
                    "{reviews[reviewIdx].content}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 999, background: "linear-gradient(135deg,#0d2238,#1e3a5f)", color: "#c9a84c", display: "grid", placeItems: "center", fontSize: 18, fontWeight: 800 }}>
                      {reviews[reviewIdx].avatar || (reviews[reviewIdx].customerName || "K").slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0d2238" }}>{reviews[reviewIdx].name || reviews[reviewIdx].customerName || "Khách hàng"}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        {reviews[reviewIdx].room || ""}{reviews[reviewIdx].room && reviews[reviewIdx].branch ? " · " : ""}{reviews[reviewIdx].branch || ""}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Navigation dots */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
              {reviews.map((_, i) => (
                <button key={i} type="button" onClick={() => setReviewIdx(i)} style={{ width: i === reviewIdx ? 24 : 8, height: 8, borderRadius: 99, border: "none", background: i === reviewIdx ? "#c9a84c" : "#cbd5e1", padding: 0, cursor: "pointer", transition: "all 0.25s" }} />
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link to={PATHS.CUSTOMER_FEEDBACKS} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 99, border: "1px solid #e2e8f0", background: "white", color: "#0d2238", fontWeight: 700, textDecoration: "none" }}>
              Xem tất cả đánh giá →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ BRANCH MAP ════════════════════════════ */}
      <section style={{ padding: "64px 0", background: "#fff" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9a7d24", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>🏢 Hệ thống</div>
            <h2 style={{ margin: 0, fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, fontFamily: "Playfair Display, serif", color: "#0d2238" }}>Chi nhánh nổi bật</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16 }}>
            <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
              {branches.slice(0, 6).map((b) => (
                <button key={b.id} type="button" onClick={() => setSelectedBranchId(b.id)}
                  style={{ padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${selectedBranchId === b.id ? "#c9a84c" : "#e2e8f0"}`, background: selectedBranchId === b.id ? "#fffbeb" : "white", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0d2238" }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>📍 {b.address}, {b.city}</div>
                </button>
              ))}
            </div>
            <div style={{ borderRadius: 18, overflow: "hidden", minHeight: 360, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              <iframe
                key={selectedBranchId}
                title="branch-map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent([selectedBranch?.address, selectedBranch?.city, "Vietnam"].filter(Boolean).join(", "))}&z=14&output=embed`}
                style={{ width: "100%", height: "100%", border: 0, minHeight: 360 }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Advantages boxes */}
      {selectedBranch && (() => {
        const ADVANTAGES = {
          "default": [
            { icon: "🏊", title: "Hồ bơi sang trọng", desc: "View thành phố tuyệt đẹp" },
            { icon: "🍳", title: "Buffet cao cấp", desc: "40+ món mỗi sáng" },
            { icon: "🧖", title: "Spa & Massage", desc: "Chuyên nghiệp, thư giãn" },
            { icon: "🏋️", title: "Gym 24/7", desc: "Trang thiết bị hiện đại" },
          ],
          "beach": [
            { icon: "🏖️", title: "Bãi biển riêng", desc: "Khu vực dành cho khách" },
            { icon: "🚤", title: "Water Sports", desc: "Kayak, lướt ván miễn phí" },
            { icon: "🌅", title: "Sunset Bar", desc: "Đón hoàng hôn tuyệt đẹp" },
            { icon: "🐠", title: "Hải sản tươi sống", desc: "Nhà hàng seafood chuẩn vị" },
          ],
        };
        const city = (selectedBranch.city || "").toLowerCase();
        const type = (city.includes("đà nẵng") || city.includes("nha trang") || city.includes("phú quốc")) ? "beach" : "default";
        const advs = ADVANTAGES[type];
        return (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>✨ Ưu điểm nổi bật</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {advs.map((adv, i) => (
                <div key={i} style={{ padding: "16px 12px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{adv.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0d2238", marginBottom: 4 }}>{adv.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{adv.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      {/* Service Detail Modal */}
      {selectedService && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "grid", placeItems: "center", padding: 20 }}
          onClick={() => setSelectedService(null)}
        >
          <div
            style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 14 }}>{selectedService.icon}</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, textAlign: "center", color: "#0d2238" }}>{selectedService.name}</h3>
            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>{selectedService.category}</div>
            <p style={{ color: "#475569", lineHeight: 1.65, fontSize: 14, margin: "0 0 18px" }}>{selectedService.desc}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 18 }}>
              <span style={{ fontSize: 14, color: "#64748b" }}>Giá dịch vụ</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: selectedService.price === 0 ? "#16a34a" : "#9a7d24" }}>
                {selectedService.price === 0 ? "Miễn phí" : formatCurrencyVnd(selectedService.price)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setSelectedService(null)} style={{ flex: 1, padding: "12px 0", borderRadius: 99, border: "1px solid #e2e8f0", background: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Đóng</button>
              <Link to={PATHS.ROOMS} style={{ flex: 1, padding: "12px 0", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Đặt phòng →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
