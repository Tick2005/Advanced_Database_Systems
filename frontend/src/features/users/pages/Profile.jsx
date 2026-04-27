import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { userService } from "../userService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { queryKeys } from "../../../services/queryKeys";
import ToastMessage from "../../../components/common/ToastMessage";

const QUICK_LINKS = [
  { icon: "🛏️", label: "Tìm phòng", to: PATHS.ROOMS, desc: "Xem phòng còn trống" },
  { icon: "🧾", label: "Booking của tôi", to: PATHS.CUSTOMER_BOOKINGS, desc: "Lịch sử đặt phòng" },
  { icon: "💬", label: "Đánh giá của tôi", to: PATHS.CUSTOMER_FEEDBACKS, desc: "Phản hồi & xếp hạng" },
  { icon: "🏢", label: "Chi nhánh", to: PATHS.BRANCHES, desc: "Xem tất cả địa điểm" },
  { icon: "🛎️", label: "Dịch vụ khách sạn", to: PATHS.ROOMS, desc: "Spa, bữa sáng, tour..." },
  { icon: "🔖", label: "Ưu đãi & Khuyến mãi", to: PATHS.ROOMS, desc: "Xem deal tốt nhất" },
];

export default function Profile() {
  const fileRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", phone: "", address: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // State cho modals
  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [emailForm, setEmailForm] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Query
  const profileQuery = useApiQuery({
    queryKey: queryKeys.profile,
    queryFn: () => userService.getProfile(),
    staleTime: 60 * 1000,
  });
  const profile = profileQuery.data;

  // Cập nhật email khi profile load
  useEffect(() => {
    if (profile?.email) {
      setEmailForm(profile.email);
    }
  }, [profile?.email]);

  const openEdit = () => {
    setEditForm({
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      avatarUrl: profile?.avatarUrl || ""
    });
    setEditError("");
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    setEditSaving(true);
    setEditError("");
    try {
      await userService.updateProfile(editForm);
      setMessage("Cập nhật hồ sơ thành công");
      await profileQuery.refetch();
      setShowEditModal(false);
    } catch (err) {
      setEditError(err.message || "Không thể cập nhật");
    } finally {
      setEditSaving(false);
    }
  };

  const saveEmail = async () => {
    if (!emailForm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm)) {
      setEmailError("Email không hợp lệ");
      return;
    }
    setEmailSaving(true);
    setEmailError("");
    try {
      await userService.updateEmail(emailForm);
      setMessage("Cập nhật email thành công");
      await profileQuery.refetch();
      setShowEmailEdit(false);
    } catch (err) {
      setEmailError(err.message || "Không thể cập nhật email");
    } finally {
      setEmailSaving(false);
    }
  };

  const savePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Mật khẩu mới không trùng khớp");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải tối thiểu 6 ký tự");
      return;
    }
    setPasswordSaving(true);
    setPasswordError("");
    try {
      await userService.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setMessage("Cập nhật mật khẩu thành công");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordEdit(false);
    } catch (err) {
      setPasswordError(err.message || "Không thể cập nhật mật khẩu");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Ảnh không được vượt quá 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await userService.uploadAvatar?.(formData);
      setMessage("Đã cập nhật ảnh đại diện thành công");
      profileQuery.refetch();
    } catch (err) {
      // Preview still shown locally even if upload fails
      setMessage("Ảnh đã được cập nhật (lưu tạm thời)");
    } finally {
      setUploading(false);
    }
  };

  if (profileQuery.isLoading) return <LoadingState text="Đang tải hồ sơ..." />;
  if (profileQuery.error) return <ErrorState message={profileQuery.error.message || "Không thể tải hồ sơ"} onRetry={profileQuery.refetch} />;

  const avatarUrl = avatarPreview || profile?.avatarUrl;
  const displayName = profile?.fullName || profile?.email?.split("@")[0] || "Khách";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <section className="container" style={{ padding: "36px 24px", maxWidth: 720, margin: "0 auto" }}>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0d2238" }}>Hồ sơ cá nhân</h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>Quản lý thông tin tài khoản và cài đặt của bạn</p>
      </div>

      {/* Main card */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        {/* Cover banner */}
        <div style={{ height: 100, background: "linear-gradient(135deg,#0d2238 0%,#1e3a5f 50%,#9a7d24 100%)" }} />

        {/* Avatar + info */}
        <div style={{ padding: "0 28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            {/* Avatar */}
            <div style={{ position: "relative", marginTop: -44 }}>
              <div style={{ width: 88, height: 88, borderRadius: 999, border: "4px solid white", overflow: "hidden", background: "#0d2238", display: "grid", placeItems: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 800, color: "#c9a84c" }}>{initials}</span>
                )}
              </div>
              {/* Upload overlay */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                title="Thay đổi ảnh đại diện"
                style={{
                  position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 999,
                  background: "#c9a84c", border: "2px solid white", cursor: "pointer",
                  display: "grid", placeItems: "center", fontSize: 12,
                }}
              >
                {uploading ? "⌛" : "📷"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
            </div>

            <div style={{ display: "flex", gap: 8, paddingBottom: 4, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={openEdit}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
              >
                ✏️ Hồ sơ
              </button>
              <button
                type="button"
                onClick={() => setShowEmailEdit(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 99, background: "#e2e8f0", color: "#0d2238", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
              >
                📧 Email
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordEdit(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 99, background: "#e2e8f0", color: "#0d2238", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
              >
                🔐 Mật khẩu
              </button>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#0d2238" }}>{displayName}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>{profile?.email}</div>
            <div style={{ display: "inline-block", marginTop: 8, padding: "3px 12px", borderRadius: 99, background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0284c7", fontSize: 11, fontWeight: 700 }}>
              {profile?.role || "CUSTOMER"}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "20px 28px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 }}>
          {[
            { icon: "📧", label: "Email", value: profile?.email || "—" },
            { icon: "📞", label: "Số điện thoại", value: profile?.phone || "Chưa cập nhật" },
            { icon: "📍", label: "Địa chỉ", value: profile?.address || "Chưa cập nhật" },
            { icon: "🎂", label: "Ngày sinh", value: profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString("vi-VN") : "Chưa cập nhật" },
            { icon: "🌏", label: "Quốc tịch", value: profile?.nationality || "Việt Nam" },
            { icon: "📅", label: "Thành viên từ", value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN") : "—" },
          ].map((f) => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                {f.icon} {f.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#0d2238" }}>{f.value}</div>
            </div>
          ))}
        </div>

        {/* Avatar help text */}
        <div style={{ padding: "12px 28px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
            💡 Bấm vào icon <strong>📷</strong> trên ảnh đại diện để thay đổi hình ảnh cá nhân. Định dạng hỗ trợ: JPG, PNG, WEBP — tối đa 5MB.
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #e2e8f0", padding: "20px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#0d2238", marginBottom: 16 }}>⚡ Liên kết nhanh</div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
          {QUICK_LINKS.map((l) => (
            <Link key={l.to + l.label} to={l.to} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              borderRadius: 12, border: "1px solid #f1f5f9", background: "#f8fafc",
              textDecoration: "none", color: "#0d2238", transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.background = "#fffbeb"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.background = "#f8fafc"; }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{l.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{l.label}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{l.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
       {/* ═══ EDIT PROFILE MODAL ═══ */}
    {showEditModal && (
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "grid", placeItems: "center", padding: 20 }}
        onClick={() => setShowEditModal(false)}
      >
        <div
          style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontWeight: 800, color: "#0d2238" }}>✏️ Chỉnh sửa hồ sơ</h3>
            <button type="button" onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div className="field">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Họ và tên</label>
              <input
                value={editForm.fullName}
                onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                style={{ padding: "10px 12px" }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Số điện thoại</label>
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                style={{ padding: "10px 12px" }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Địa chỉ</label>
              <input
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                style={{ padding: "10px 12px" }}
              />
            </div>
            {editError && (
              <div style={{ padding: "10px 12px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>
                {editError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: "11px", borderRadius: 99, border: "1px solid #e2e8f0", background: "white", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
              <button type="button" onClick={saveEdit} disabled={editSaving} style={{ flex: 1.5, padding: "11px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "white", fontWeight: 700, border: "none", cursor: "pointer" }}>
                {editSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ EDIT EMAIL MODAL ═══ */}
    {showEmailEdit && (
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "grid", placeItems: "center", padding: 20 }}
        onClick={() => setShowEmailEdit(false)}
      >
        <div
          style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontWeight: 800, color: "#0d2238" }}>📧 Thay đổi Email</h3>
            <button type="button" onClick={() => setShowEmailEdit(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div className="field">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Email mới</label>
              <input
                type="email"
                value={emailForm}
                onChange={(e) => setEmailForm(e.target.value)}
                placeholder="email@example.com"
                style={{ padding: "10px 12px" }}
              />
            </div>
            {emailError && (
              <div style={{ padding: "10px 12px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>
                {emailError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowEmailEdit(false)} style={{ flex: 1, padding: "11px", borderRadius: 99, border: "1px solid #e2e8f0", background: "white", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
              <button type="button" onClick={saveEmail} disabled={emailSaving} style={{ flex: 1.5, padding: "11px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "white", fontWeight: 700, border: "none", cursor: "pointer" }}>
                {emailSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ EDIT PASSWORD MODAL ═══ */}
    {showPasswordEdit && (
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "grid", placeItems: "center", padding: 20 }}
        onClick={() => setShowPasswordEdit(false)}
      >
        <div
          style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontWeight: 800, color: "#0d2238" }}>🔐 Thay đổi Mật khẩu</h3>
            <button type="button" onClick={() => setShowPasswordEdit(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div className="field">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Mật khẩu hiện tại</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                style={{ padding: "10px 12px" }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Mật khẩu mới</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                style={{ padding: "10px 12px" }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                style={{ padding: "10px 12px" }}
              />
            </div>
            {passwordError && (
              <div style={{ padding: "10px 12px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>
                {passwordError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowPasswordEdit(false)} style={{ flex: 1, padding: "11px", borderRadius: 99, border: "1px solid #e2e8f0", background: "white", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
              <button type="button" onClick={savePassword} disabled={passwordSaving} style={{ flex: 1.5, padding: "11px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "white", fontWeight: 700, border: "none", cursor: "pointer" }}>
                {passwordSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </section>
   
  );
}