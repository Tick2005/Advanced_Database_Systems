import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "../userService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      setProfile(await userService.getProfile());
    } catch (err) {
      setError(err.message || "Không thể tải profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState text="Đang tải profile..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 600 }}>
      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Hồ sơ của tôi</h1>
        <p style={{ margin: 0, color: "#64748b" }}>Xem và cập nhật thông tin tài khoản cá nhân của bạn</p>
      </div>

      <div className="card-elevated" style={{ padding: 24, display: "grid", gap: 18 }}>
        {/* Avatar & Basic */}
        <div style={{ display: "grid", gap: 12, textAlign: "center" }}>
          {profile.avatarUrl && <img src={profile.avatarUrl} alt="Avatar" style={{ width: 80, height: 80, borderRadius: 999, margin: "0 auto", objectFit: "cover" }} />}
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0d2238" }}>{profile.fullName || "Chưa cập nhật tên"}</div>
            <span className="pill pill-soft">{profile.role}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }} />

        {/* Contact Info */}
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>THÔNG TIN LIÊN HỆ</div>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "grid", gap: 2 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Email</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{profile.email}</span>
            </div>
            <div style={{ display: "grid", gap: 2 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Số điện thoại</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{profile.phone || "Chưa cập nhật"}</span>
            </div>
            <div style={{ display: "grid", gap: 2 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Địa chỉ</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{profile.address || "Chưa cập nhật"}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          <Link className="btn btn-gold" to={PATHS.CUSTOMER_PROFILE_EDIT}>Chỉnh sửa hồ sơ</Link>
          <Link className="btn pill pill-soft" to={PATHS.CUSTOMER_SETTINGS}>Cài đặt tài khoản</Link>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>LIÊN KẾT NHANH</div>
        <Link to={PATHS.CUSTOMER_BOOKINGS} style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, textDecoration: "none", color: "#0d2238", transition: "all 0.2s" }} onMouseEnter={(e) => e.target.style.background = "#f8fafc"} onMouseLeave={(e) => e.target.style.background = "transparent"}>
          <span style={{ fontWeight: 500 }}>Booking của tôi</span>
          <span>→</span>
        </Link>
        <Link to={PATHS.CUSTOMER_FEEDBACKS} style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, textDecoration: "none", color: "#0d2238", transition: "all 0.2s" }} onMouseEnter={(e) => e.target.style.background = "#f8fafc"} onMouseLeave={(e) => e.target.style.background = "transparent"}>
          <span style={{ fontWeight: 500 }}>Đánh giá của tôi</span>
          <span>→</span>
        </Link>
      </div>
    </section>
  );
}
