import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { roomService } from "../features/rooms/roomService";
import { branchService } from "../features/branches/branchService";
import { feedbackService } from "../features/feedback/feedbackService";
import { PATHS } from "../routes/pathConstants";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import RoomCard from "../features/rooms/RoomCard";
import { formatCurrencyVnd } from "../services/presenters";

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [topRoomTypes, setTopRoomTypes] = useState([]);
  const [feedbackHighlights, setFeedbackHighlights] = useState([]);
  const [selectedFeaturedBranchId, setSelectedFeaturedBranchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const heroSlides = [
    "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg",
    "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
    "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg",
    "https://images.pexels.com/photos/271619/pexels-photo-271619.jpeg",
    "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg",
    "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg"
  ];

  const featuredRooms = useMemo(() => rooms.filter((room) => room.status === "AVAILABLE").slice(0, 6), [rooms]);
  const featuredBranches = useMemo(() => (branches || []).slice(0, 5), [branches]);
  const selectedFeaturedBranch = useMemo(
    () => featuredBranches.find((item) => item.id === selectedFeaturedBranchId) || featuredBranches[0] || null,
    [featuredBranches, selectedFeaturedBranchId]
  );

  const buildBranchMapUrl = (branch) => {
    if (!branch) return "";
    const query = [branch.address, branch.city, branch.country].filter(Boolean).join(", ") || branch.name || "Vietnam";
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [roomData, branchData, topTypes] = await Promise.all([
        roomService.getRooms(),
        branchService.getTopBranches(),
        roomService.getTopRoomTypes()
      ]);
      const roomList = roomData || [];
      setRooms(roomList);
      setBranches(branchData || []);
      setTopRoomTypes(topTypes || []);

      const feedbackPromises = roomList.slice(0, 3).map((room) => feedbackService.getFeedbackByRoom(room.id));
      const feedbackChunks = await Promise.all(feedbackPromises);
      const merged = feedbackChunks
        .flatMap((chunk) => chunk || [])
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 6);
      setFeedbackHighlights(merged);
    } catch (err) {
      setError(err.message || "Khong the tai du lieu trang chu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedFeaturedBranchId && featuredBranches.length > 0) {
      setSelectedFeaturedBranchId(featuredBranches[0].id);
    }
  }, [selectedFeaturedBranchId, featuredBranches]);

  if (loading) return <LoadingState text="Dang tai trang chu..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

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
              <img src={heroSlides[0]} alt="LuxStay hero" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="container section-block" style={{ paddingTop: 36 }}>
        <div className="page-heading">
          <h2>Không gian khách sạn</h2>
          <p>Tạo cảm giác boutique, cao cấp và rất “hotel” ngay từ lần đầu truy cập.</p>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <div className="hotel-marquee">
            <div className="hotel-marquee-track">
              {[...heroSlides, ...heroSlides].map((src, index) => (
                <img key={`${src}-${index}`} src={src} alt={`LuxStay ${index + 1}`} loading="lazy" className="hotel-marquee-image" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container section-block">
        <div className="page-heading">
          <h2>Về chúng tôi</h2>
          <p>Thiết kế trải nghiệm đặt phòng và vận hành giống một hệ thống khách sạn thật.</p>
        </div>
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
      </section>

      <section className="container section-block">
        <div className="page-heading">
          <h2>Phòng nổi bật</h2>
          <p>Những phòng được khách chọn nhiều nhất với giá, ảnh và trạng thái cập nhật rõ ràng.</p>
        </div>
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {featuredRooms.map((room) => (
            <RoomCard key={room.id} room={room} detailPath={PATHS.ROOM_DETAIL} />
          ))}
        </div>
      </section>

      <section className="container section-block">
        <div className="page-heading">
          <h2>Chi nhánh nổi bật</h2>
          <p>Hệ thống chi nhánh trải đều ở các thành phố du lịch lớn.</p>
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

      <section className="container section-block">
        <div className="page-heading">
          <h2>Dịch vụ được quan tâm</h2>
          <p>Nhóm room type có doanh thu tốt nhất để người dùng hiểu nhanh giá trị hệ thống.</p>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))" }}>
          {(topRoomTypes || []).slice(0, 4).map((item) => (
            <article key={`${item.roomTypeName}-${item.branchName}`} className="card feature-card">
              <div className="feature-icon">✦</div>
              <strong>{item.roomTypeName}</strong>
              <span style={{ color: "#64748b" }}>{item.branchName}</span>
              <span className="room-price">{formatCurrencyVnd(item.totalRevenue || 0)}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="container section-block">
        <div className="page-heading">
          <h2>Phản hồi mới nhất</h2>
          <p>Giữ cảm giác dịch vụ thật bằng phản hồi trực tiếp từ khách hàng.</p>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
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
          <h2>Liên hệ và bản đồ</h2>
          <p>Thông tin hỗ trợ và vị trí văn phòng được đặt rõ ràng, dễ tiếp cận.</p>
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          <div className="card card-elevated" style={{ padding: 16, lineHeight: 1.7 }}>
            <strong>Hotline: 1900 6868</strong>
            <div>Email: support@luxstay.local</div>
            <div>Van phong: 01 Tran Phu, Hai Chau, Da Nang</div>
          </div>
          <div className="card" style={{ overflow: "hidden", minHeight: 260 }}>
            <iframe
              title="LuxStay map"
              src="https://maps.google.com/maps?q=Da%20Nang%20Vietnam&t=&z=12&ie=UTF8&iwloc=&output=embed"
              style={{ border: 0, width: "100%", height: "100%", minHeight: 260 }}
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  );
}
