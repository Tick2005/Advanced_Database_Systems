import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { roomService } from "../features/rooms/roomService";
import { serviceService } from "../features/services/serviceService";
import { branchService } from "../features/branches/branchService";
import { feedbackService } from "../features/feedback/feedbackService";
import { PATHS } from "../routes/pathConstants";
import { useCustomerSettings } from "../hooks/useCustomerSettings";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import RatingStars from "../components/common/RatingStars";
import { formatCurrencyVnd } from "../services/presenters";
import { useApiQuery } from "../hooks/useApiQuery";
import { queryKeys } from "../services/queryKeys";
import { loadLocationFromStorage, sortRoomsByProximityAndRating } from "../services/geo";

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
  "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg",
  "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg",
];

const SERVICE_CATEGORIES = ["Tất cả", "BOTH", "PREBOOK", "ON_SITE"];



/* ─── COMPONENT ─────────────────────────────────────────────────────────────── */
export default function Home() {
  const { settings } = useCustomerSettings();
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [roomSlideIdx, setRoomSlideIdx] = useState(0);
  const [serviceCategory, setServiceCategory] = useState("Tất cả");
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [userLocation, setUserLocation] = useState(() => loadLocationFromStorage());
  const [allowLocation, setAllowLocation] = useState(true);
  const [reviewIdx, setReviewIdx] = useState(0);
  const roomSliderRef = useRef(null);
  const [reviewFade, setReviewFade] = useState(true);

  // Sync allowLocation from settings hook
  useEffect(() => {
    setAllowLocation(settings.allowLocation);
  }, [settings.allowLocation]);

  // Watch for location changes from other components (e.g., PublicLayout)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user_location") {
        try {
          const newLoc = e.newValue ? JSON.parse(e.newValue) : null;
          setUserLocation(newLoc);
        } catch (err) {
          console.error("Failed to parse location from storage", err);
        }
      }
    };

    const handleCustom = (e) => {
      try {
        const newLoc = e?.detail || loadLocationFromStorage();
        setUserLocation(newLoc);
      } catch (err) {
        console.error("Failed to handle custom user_location_updated event", err);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user_location_updated", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user_location_updated", handleCustom);
    };
  }, []);

  /* ── Queries ── */
  const branchesQ = useApiQuery({ queryKey: queryKeys.branches, queryFn: () => branchService.getTopBranches(), staleTime: 60000 });
  const roomsQ = useApiQuery({ queryKey: queryKeys.rooms(), queryFn: () => roomService.getRooms(), staleTime: 60000 });
  const servicesQ = useApiQuery({
    queryKey: ["home-services", selectedBranchId],
    queryFn: () => (selectedBranchId ? serviceService.getPublicServicesByBranch(selectedBranchId) : []),
    staleTime: 60000,
    enabled: Boolean(selectedBranchId),
  });
  const roomFeedbackSummaryQ = useApiQuery({
    queryKey: ["home-feedback-summary", roomsQ.data?.length || 0],
    queryFn: () => feedbackService.getRoomFeedbackSummaries((roomsQ.data || []).map((room) => room.id)),
    staleTime: 60000,
    enabled: Boolean((roomsQ.data || []).length),
  });
  const feedbackQ = useApiQuery({
    queryKey: ["home-feedback-top"],
    queryFn: () => feedbackService.getTopFeedbacks(10),
    staleTime: 60000,
  });

  const branches = branchesQ.data || [];
  const rooms = roomsQ.data || [];
  const roomFeedbackSummaryMap = useMemo(() => {
    const entries = roomFeedbackSummaryQ.data || [];
    return entries.reduce((acc, item) => {
      if (item?.roomId) {
        acc[item.roomId] = {
          averageRating: Number(item.averageRating || 0),
          reviewCount: Number(item.reviewCount || 0),
        };
      }
      return acc;
    }, {});
  }, [roomFeedbackSummaryQ.data]);
  
  /* Enrich from DB or use static - prioritize by user location */
  const topRooms = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];

    return sortRoomsByProximityAndRating(rooms, branches, userLocation, allowLocation)
      .slice(0, 4)
      .map((room, index) => ({
        ...room,
        averageRating: roomFeedbackSummaryMap[room.id]?.averageRating ?? 0,
        reviewCount: roomFeedbackSummaryMap[room.id]?.reviewCount ?? 0,
        img: room.imageUrl || ROOM_IMAGES[index % ROOM_IMAGES.length],
      }));
  }, [rooms, branches, userLocation, allowLocation, roomFeedbackSummaryMap]);

  const reviews = useMemo(() => {
    return feedbackQ.data || [];
  }, [feedbackQ.data]);

  const services = useMemo(() => {
    const live = servicesQ.data || [];
    if (serviceCategory === "Tất cả") return live;
    return live.filter((service) => service.serviceMode === serviceCategory);
  }, [servicesQ.data, serviceCategory]);

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
  if (servicesQ.isLoading) return <LoadingState text="Đang tải dịch vụ..." />;
  /* ── Room slider scroll sync ── */
  const CARD_W = 300;
  const scrollRooms = (dir) => {
    const next = Math.max(0, Math.min(topRooms.length - 1, roomSlideIdx + dir));
    setRoomSlideIdx(next);
    if (roomSliderRef.current) {
      roomSliderRef.current.scrollTo({ left: next * (CARD_W + 16), behavior: "smooth" });
    }
  };

  if (branchesQ.isLoading || roomsQ.isLoading) return <LoadingState text="Đang tải trang chủ..." />;
  if (branchesQ.error) return <ErrorState message={branchesQ.error.message} onRetry={branchesQ.refetch} />;
  if (roomsQ.error) return <ErrorState message={roomsQ.error.message} onRetry={roomsQ.refetch} />;

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
      {/* ═══════════════════ INTRO / WHY LUXSTAY ════════════════════ */}
      <section style={{ padding: "48px 0", background: "linear-gradient(135deg,#0d2238 0%,#1e3a5f 100%)", color: "white" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
            Tại sao chọn LuxStay?
          </div>
          <h2 style={{ margin: "0 0 14px", fontSize: "clamp(20px,3vw,30px)", fontWeight: 800, fontFamily: "Playfair Display, serif" }}>
            Nền tảng đặt phòng khách sạn hàng đầu Việt Nam
          </h2>
          <p style={{ maxWidth: 640, margin: "0 auto 36px", color: "rgba(255,255,255,0.75)", lineHeight: 1.8, fontSize: 15 }}>
            LuxStay kết nối bạn với hơn 500 phòng cao cấp trên toàn quốc — từ nghỉ dưỡng ven biển đến khách sạn thương mại trung tâm. 
            Đặt phòng trong 3 bước, thanh toán an toàn qua VNPay, check-in không chờ đợi.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { icon: "⚡", title: "Đặt phòng tức thì", desc: "Xác nhận ngay trong vài giây" },
              { icon: "🔒", title: "Thanh toán an toàn", desc: "Tích hợp VNPay chuẩn bảo mật" },
              { icon: "📍", title: "Gợi ý theo vị trí", desc: "Tìm chi nhánh gần bạn nhất" },
              { icon: "⭐", title: "Đánh giá thực", desc: "Phản hồi từ khách đã lưu trú" },
            ].map((item) => (
              <div key={item.title} style={{ flex: "1 1 160px", maxWidth: 200 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{item.desc}</div>
              </div>
            ))}
          </div>
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
                  {Number(room.averageRating || 0) > 0 && (
                    <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", color: "#fbbf24", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                      ★ {Number(room.averageRating || 0).toFixed(1)}
                    </div>
                  )}
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0d2238", marginBottom: 4 }}>{room.roomTypeName} · #{room.roomNumber}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>📍 {room.branchName || room.branchCity || ""}</div>

                  {/* Star rating */}
                  <div style={{ marginBottom: 8 }}>
                    <RatingStars value={room.averageRating} size={14} showValue />
                  </div>
                  {Number(room.reviewCount || 0) > 0 && (
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                      {room.reviewCount} đánh giá thực tế
                    </div>
                  )}
                  {room.branchCity && (
                    <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginBottom: 6 }}>
                      📍 {room.branchCity}
                    </div>
                  )}

                  <Link to={PATHS.ROOM_DETAIL.replace(":id", room.id)} style={{ display: "block", marginTop: 8, padding: "9px 0", textAlign: "center", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0d2238", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
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
                  padding: 12, borderRadius: 16, border: "1px solid #e2e8f0", background: "white",
                  cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                  display: "grid", gap: 10,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 12, alignItems: "stretch", textAlign: "left" }}>
                  <div style={{ borderRadius: 12, overflow: "hidden", minHeight: 76, display: "grid", placeItems: "center", background: "#f8fafc" }}>
                    {svc.thumbnailUrl ? (
                      <img src={svc.thumbnailUrl} alt={svc.name} style={{ width: 72, height: 76, objectFit: "cover" }} />
                    ) : (
                      <div style={{ borderRadius: 14, background: "linear-gradient(135deg,#0d2238 0%,#1e3a5f 60%,#c9a84c 100%)", minHeight: 76, display: "grid", placeItems: "center", color: "white" }}>
                        <div style={{ fontSize: 22, lineHeight: 1 }}>{svc.category?.slice(0, 1) || "•"}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "grid", alignContent: "center", gap: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0d2238" }}>{svc.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{svc.category}</div>
                    <div style={{ fontWeight: 800, color: svc.price === 0 ? "#16a34a" : "#9a7d24", fontSize: 13 }}>
                      {svc.price === 0 ? "Miễn phí" : formatCurrencyVnd(svc.price)}
                    </div>
                  </div>
                </div>
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
              Top 10 phản hồi nổi bật
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
                  <div style={{ marginBottom: 16 }}>
                    <RatingStars value={reviews[reviewIdx].rating} size={20} showValue={false} />
                  </div>
                  <p style={{ margin: "0 0 24px", color: "#334155", fontSize: 16, lineHeight: 1.7, fontStyle: "italic" }}>
                    "{reviews[reviewIdx].content}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 999, background: "linear-gradient(135deg,#0d2238,#1e3a5f)", color: "#c9a84c", display: "grid", placeItems: "center", fontSize: 18, fontWeight: 800 }}>
                      {reviews[reviewIdx].avatarUrl ? "🖼️" : (reviews[reviewIdx].customerName || "K").slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0d2238" }}>{reviews[reviewIdx].customerName || "Khách hàng"}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        {reviews[reviewIdx].roomName || ""}{reviews[reviewIdx].roomName && reviews[reviewIdx].branchName ? " · " : ""}{reviews[reviewIdx].branchName || ""}
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
            <Link to={PATHS.CUSTOMER_BOOKINGS} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 99, border: "1px solid #e2e8f0", background: "white", color: "#0d2238", fontWeight: 700, textDecoration: "none" }}>
              Xem đánh giá trong booking history →
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
          <section style={{ padding: "48px 0", background: "linear-gradient(135deg,#0d2238 0%,#1e3a5f 100%)", color: "white" }}>
            <div className="container">
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
                  ✨ Ưu điểm nổi bật — {selectedBranch.name}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
                {advs.map((adv, i) => (
                  <div key={i} style={{ padding: "24px 16px", borderRadius: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>{adv.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#c9a84c", marginBottom: 6 }}>{adv.title}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{adv.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
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
