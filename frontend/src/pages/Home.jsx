import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { roomService } from "../features/rooms/roomService";
import { branchService } from "../features/branches/branchService";
import { feedbackService } from "../features/feedback/feedbackService";
import { serviceService } from "../features/services/serviceService";
import { PATHS } from "../routes/pathConstants";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import { formatCurrencyVnd } from "../services/presenters";
import { useApiQuery } from "../hooks/useApiQuery";
import { queryKeys } from "../services/queryKeys";

export default function Home() {
  const [selectedFeaturedBranchId, setSelectedFeaturedBranchId] = useState("");
  const [spaceSlideIndex, setSpaceSlideIndex] = useState(0);
  const heroSlides = [
    "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg",
    "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
    "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg",
    "https://images.pexels.com/photos/271619/pexels-photo-271619.jpeg",
    "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg",
    "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg"
  ];

  const roomsQuery = useApiQuery({
    queryKey: queryKeys.rooms(),
    queryFn: () => roomService.getRooms(),
    staleTime: 60 * 1000
  });

  const branchesQuery = useApiQuery({
    queryKey: queryKeys.branches,
    queryFn: () => branchService.getTopBranches(),
    staleTime: 60 * 1000
  });

  const topRoomTypesQuery = useApiQuery({
    queryKey: queryKeys.topRoomTypes,
    queryFn: () => roomService.getTopRoomTypes(),
    staleTime: 60 * 1000
  });

  const rooms = roomsQuery.data || [];
  const branches = branchesQuery.data || [];
  const topRoomTypes = topRoomTypesQuery.data || [];

  const feedbackHighlightsQuery = useApiQuery({
    queryKey: ["home-feedback-highlights", rooms.slice(0, 3).map((room) => room.id).join("|")],
    queryFn: async () => {
      const feedbackPromises = rooms.slice(0, 3).map((room) => feedbackService.getFeedbackByRoom(room.id));
      const feedbackChunks = await Promise.all(feedbackPromises);
      return feedbackChunks
        .flatMap((chunk) => chunk || [])
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 3);
    },
    enabled: rooms.length > 0,
    staleTime: 30 * 1000
  });

  const servicesHighlightQuery = useApiQuery({
    queryKey: ["home-services-highlight", branches.map((item) => item.id).join("|")],
    queryFn: async () => {
      const sourceBranches = branches.slice(0, 2);
      const chunks = await Promise.all(sourceBranches.map((branch) => serviceService.getPublicServicesByBranch(branch.id)));
      return chunks
        .flatMap((chunk) => chunk || [])
        .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
        .slice(0, 5);
    },
    enabled: branches.length > 0,
    staleTime: 60 * 1000
  });

  const feedbackHighlights = feedbackHighlightsQuery.data || [];

  const featuredProfitRooms = useMemo(() => topRoomTypes.slice(0, 5), [topRoomTypes]);
  const featuredBranches = useMemo(() => branches.slice(0, 5), [branches]);
  const highlightedServices = servicesHighlightQuery.data || [];
  const selectedFeaturedBranch = useMemo(
    () => featuredBranches.find((item) => item.id === selectedFeaturedBranchId) || featuredBranches[0] || null,
    [featuredBranches, selectedFeaturedBranchId]
  );

  const buildBranchMapUrl = (branch) => {
    if (!branch) return "";
    const query = [branch.address, branch.city, branch.country].filter(Boolean).join(", ") || branch.name || "Vietnam";
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  };

  useEffect(() => {
    if (!selectedFeaturedBranchId && featuredBranches.length > 0) {
      setSelectedFeaturedBranchId(featuredBranches[0].id);
    }
  }, [selectedFeaturedBranchId, featuredBranches]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setSpaceSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const isLoading = roomsQuery.isLoading || branchesQuery.isLoading || topRoomTypesQuery.isLoading;
  const requestError = roomsQuery.error || branchesQuery.error || topRoomTypesQuery.error || feedbackHighlightsQuery.error || servicesHighlightQuery.error;

  if (isLoading) return <LoadingState text="Dang tai trang chu..." />;
  if (requestError) {
    return (
      <ErrorState
        message={requestError.message || "Khong the tai du lieu trang chu"}
        onRetry={() => {
          roomsQuery.refetch();
          branchesQuery.refetch();
          topRoomTypesQuery.refetch();
          feedbackHighlightsQuery.refetch();
          servicesHighlightQuery.refetch();
        }}
      />
    );
  }

  return (
    <>
      <section className="container page-shell">
        <div className="page-hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="hero-badge">Luxury hotel booking experience</span>
              <h1 style={{ fontSize: "clamp(40px, 6vw, 68px)", margin: 0, lineHeight: 0.98 }}>Trải nghiệm lưu trú sang trọng, đặt phòng trong vài phút</h1>
              <p style={{ maxWidth: 640, margin: 0, color: "rgba(255,255,255,0.84)" }}>Tìm phòng theo chi nhánh, ngân sách và nhu cầu thực tế với giao diện gọn, sáng và tập trung như một hệ thống khách sạn hiện đại.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link className="btn btn-gold" to={PATHS.ROOMS}>Tìm phòng ngay</Link>
                <Link className="btn" style={{ color: "white", border: "1px solid rgba(255,255,255,0.26)", background: "rgba(255,255,255,0.06)" }} to={PATHS.BRANCHES}>Xem chi nhánh</Link>
              </div>
              <div className="hero-stats">
                <div className="hero-stat"><strong>4.9/5</strong><span>Đánh giá trải nghiệm</span></div>
                <div className="hero-stat"><strong>24/7</strong><span>Hỗ trợ đặt phòng</span></div>
                <div className="hero-stat"><strong>12+</strong><span>Chi nhánh vận hành</span></div>
              </div>
            </div>
            <div className="hero-media card">
              <img src={heroSlides[spaceSlideIndex]} alt="LuxStay hero" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="container section-block" style={{ paddingTop: 36 }}>
        <div className="page-heading">
          <h2>Không gian khách sạn</h2>
        
        </div>
        <div className="card card-elevated" style={{ padding: 12, display: "grid", gap: 10 }}>
          <div className="hotel-space-slider" style={{ borderRadius: 18, overflow: "hidden" }}>
            <img src={heroSlides[spaceSlideIndex]} alt={`Khong gian ${spaceSlideIndex + 1}`} loading="lazy" style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {heroSlides.map((_, index) => (
              <button
                key={`space-dot-${index}`}
                type="button"
                onClick={() => setSpaceSlideIndex(index)}
                aria-label={`Xem anh ${index + 1}`}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  border: "none",
                  background: index === spaceSlideIndex ? "#c9a84c" : "#cbd5e1",
                  cursor: "pointer"
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="container section-block">
        <div className="page-heading">
          <h2>Về chúng tôi</h2>
          <p>Thiết kế trải nghiệm đặt phòng và vận hành giống một hệ thống khách sạn thật.</p>
        </div>
        <div className="split-panel" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
          <div className="card card-elevated" style={{ padding: 18, lineHeight: 1.7 }}>
            <p style={{ marginTop: 0 }}>
              LuxStay khong chi la mot nen tang dat phong, ma la mot he sinh thai van hanh khach san thong minh giup ket noi
              khach luu tru voi cac chi nhanh tai Da Nang, TP.HCM va nhieu thanh pho du lich lon.
            </p>
            <p>
              Chung toi toi uu toan bo hanh trinh truoc - trong - sau khi nhan phong: tim phong nhanh, dat phong trong 3 buoc,
              thanh toan VNPAY an toan, theo doi booking theo thoi gian thuc va nhan ho tro truc tiep tu nhan vien tai chi nhanh.
            </p>
            <p style={{ marginBottom: 0 }}>
              Dinh huong cua LuxStay la mang den trai nghiem dong nhat 4-5 sao tren moi diem cham: chat luong phong,
              dich vu tai cho, phan hoi khach hang va kha nang tu dong hoa van hanh cho doi ngu staff/manager/owner.
            </p>
          </div>
          <div className="card" style={{ overflow: "hidden", minHeight: 280 }}>
            <img src={heroSlides[(spaceSlideIndex + 1) % heroSlides.length]} alt="Ve chung toi" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </section>

      <section className="container section-block">
        <div className="page-heading">
          <h2>Top 5 phòng theo lợi nhuận</h2>
          <p>Hiển thị đúng 5 khung ngang để dễ so sánh hiệu suất bán phòng.</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(5,minmax(190px,1fr))", minWidth: 1000 }}>
            {featuredProfitRooms.map((item, index) => (
              <article key={`${item.roomTypeName}-${item.branchName}`} className="card feature-card" style={{ minHeight: 170 }}>
                <div className="feature-icon">#{index + 1}</div>
                <strong>{item.roomTypeName}</strong>
                <span style={{ color: "#64748b" }}>{item.branchName}</span>
                <span className="room-price">{formatCurrencyVnd(item.totalRevenue || 0)}</span>
              </article>
            ))}
            {featuredProfitRooms.length === 0 && <div className="card" style={{ padding: 14 }}>Chưa có dữ liệu lợi nhuận phòng.</div>}
          </div>
        </div>
      </section>

      <section className="container section-block">
        <div className="page-heading">
          <h2>Dịch vụ được quan tâm</h2>
          <p>Dữ liệu lấy từ bảng services để phản ánh nhu cầu dịch vụ thực tế theo chi nhánh.</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(5,minmax(190px,1fr))", minWidth: 1000 }}>
            {highlightedServices.map((service) => (
              <article key={service.id || service.code} className="card feature-card" style={{ minHeight: 170 }}>
                <div className="feature-icon">🧰</div>
                <strong>{service.name || service.code}</strong>
                <span style={{ color: "#64748b" }}>{service.serviceMode || service.code || "SERVICE"}</span>
                <span className="room-price">{formatCurrencyVnd(service.price || 0)}</span>
              </article>
            ))}
            {highlightedServices.length === 0 && <div className="card" style={{ padding: 14 }}>Chưa có dữ liệu dịch vụ nổi bật.</div>}
          </div>
        </div>
      </section>

      <section className="container section-block" data-section="reviews">
        <div className="page-heading">
          <h2>Phản hồi mới nhất</h2>
          <p>Hiển thị 3 phản hồi gần nhất để giao diện gọn và tập trung.</p>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          {feedbackHighlights.length === 0 && <div className="card" style={{ padding: 14 }}>Chưa có phản hồi mới.</div>}
          {feedbackHighlights.map((fb) => (
            <article key={fb.id} className="card feature-card">
              <div className="feature-icon">★</div>
              <div style={{ fontWeight: 700 }}>⭐ {fb.rating}/5</div>
              <div style={{ color: "#334155" }}>{fb.content}</div>
              {fb.managerReply && <small style={{ color: "#64748b" }}>Phan hoi quan ly: {fb.managerReply}</small>}
            </article>
          ))}
        </div>
      </section>

      <section className="container section-block">
        <div className="page-heading">
          <h2>Chi nhánh nổi bật</h2>
          <p>Thông tin chi nhánh có sẵn trong trang riêng, tại đây chỉ giữ phần preview nhanh.</p>
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
          <div style={{ display: "grid", gap: 10 }}>
            {featuredBranches.map((branch) => {
              const active = selectedFeaturedBranch?.id === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  className="card"
                  onClick={() => setSelectedFeaturedBranchId(branch.id)}
                  style={{
                    padding: 14,
                    textAlign: "left",
                    border: active ? "1px solid #c9a84c" : "1px solid #e2e8f0",
                    background: active ? "#fffaf0" : "#fff",
                    cursor: "pointer",
                    display: "grid",
                    gap: 4
                  }}
                >
                  <strong style={{ fontSize: 16 }}>{branch.name}</strong>
                  <span style={{ color: "#64748b", fontSize: 13 }}>{branch.address}, {branch.city}</span>
                </button>
              );
            })}
          </div>

          <article className="card-elevated" style={{ padding: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gap: 4, padding: "4px 6px" }}>
              <strong style={{ fontSize: 18 }}>{selectedFeaturedBranch?.name || "Chi nhánh"}</strong>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                {[selectedFeaturedBranch?.address, selectedFeaturedBranch?.city].filter(Boolean).join(", ")}
              </span>
            </div>
            <div className="card" style={{ overflow: "hidden", minHeight: 280 }}>
              <iframe
                title={`map-${selectedFeaturedBranch?.id || "branch"}`}
                src={buildBranchMapUrl(selectedFeaturedBranch)}
                style={{ border: 0, width: "100%", height: "100%", minHeight: 280 }}
                loading="lazy"
              />
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
