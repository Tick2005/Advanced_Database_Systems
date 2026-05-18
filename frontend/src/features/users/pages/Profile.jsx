import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userService } from "../userService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useCustomerSettings } from "../../../hooks/useCustomerSettings";
import { queryKeys } from "../../../services/queryKeys";
import ToastMessage from "../../../components/common/ToastMessage";

const QUICK_LINKS = [
  { icon: "🛏️", label: "Tìm phòng", to: PATHS.ROOMS, desc: "Xem phòng còn trống" },
  { icon: "🧾", label: "Booking của tôi", to: PATHS.CUSTOMER_BOOKINGS, desc: "Lịch sử đặt phòng" },
  { icon: "🛎️", label: "Dịch vụ khách sạn", to: PATHS.ROOMS, desc: "Spa, bữa sáng, tour..." },
  { icon: "⚙️", label: "Cài đặt", to: PATHS.CUSTOMER_SETTINGS, desc: "Theme, vị trí, camera" },
];

export default function Profile() {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();
  const { settings, loading: settingsLoading, updateSettings } = useCustomerSettings();
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCameraPermissionModal, setShowCameraPermissionModal] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", address: "", preferredLanguage: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [emailForm, setEmailForm] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Query
  const profileQuery = useApiQuery({
    queryKey: queryKeys.profile,
    queryFn: () => userService.getProfile(),
    staleTime: 60 * 1000,
  });
  const profile = profileQuery.data;

  const openEdit = () => {
    setEditForm({
      fullName: profile?.fullName || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      preferredLanguage: profile?.preferredLanguage || "vi"
    });
    setEditError("");
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    setEditSaving(true);
    setEditError("");
    try {
      await userService.updateProfile({
        fullName: editForm.fullName,
        phone: editForm.phone,
        address: editForm.address,
        preferredLanguage: editForm.preferredLanguage
      });
      if (editForm.email && editForm.email !== profile?.email) {
        await userService.updateEmail(editForm.email);
      }
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
    reader.onload = async (ev) => {
      const nextAvatarUrl = String(ev.target.result || "");
      setAvatarPreview(nextAvatarUrl);
      setUploading(true);
      try {
        await userService.updateProfile({ avatarUrl: nextAvatarUrl });
        setMessage("Đã cập nhật ảnh đại diện thành công");
        await profileQuery.refetch();
        setAvatarMenuOpen(false);
      } catch (err) {
        setError(err.message || "Không thể cập nhật ảnh đại diện");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatarFromDataUrl = async (dataUrl) => {
    setAvatarPreview(dataUrl);
    setUploading(true);
    try {
      await userService.updateProfile({ avatarUrl: dataUrl });
      setMessage("Đã cập nhật ảnh đại diện thành công");
      await profileQuery.refetch();
      setAvatarMenuOpen(false);
    } catch (err) {
      setError(err.message || "Không thể cập nhật ảnh đại diện");
    } finally {
      setUploading(false);
    }
  };

  const handleCameraClick = async (forceAllowed = false) => {
    setError("");
    setVideoReady(false);

    // Wait for settings to load before checking permissions
    if (settingsLoading) {
      setError("Đang tải cài đặt. Vui lòng chờ một chút.");
      return;
    }

    if (!settings?.allowCamera && !forceAllowed) {
      setShowCameraPermissionModal(true);
      return;
    }

    if (!navigator?.mediaDevices) {
      setError("Trình duyệt không hỗ trợ camera");
      return;
    }

    try {
      // Open an in-app camera modal first so the <video> element mounts and
      // `videoRef` becomes available. Some browsers render the modal asynchronously
      // and assigning srcObject before the element exists causes the preview to
      // never attach, leaving the UI stuck on the loading overlay.
      setShowCameraModal(true);

      // Request the stream and attach after a short tick to allow the video node
      // to be mounted and the ref populated. 50ms is typically enough.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      await new Promise((resolve) => setTimeout(resolve, 50));

      if (videoRef.current) {
        try {
          videoRef.current.srcObject = stream;
          // Don't reset videoReady here - let the onLoadedMetadata/onPlay handlers set it
          try { await videoRef.current.play(); } catch (e) {}
        } catch (attachErr) {
          // If attaching fails, still show modal and rely on user to retry
          console.warn('Failed to attach MediaStream to video element', attachErr);
        }

        // Safety fallback: if video events don't fire within 2 seconds, force ready
        // This handles edge cases on certain browsers/OS combinations
        setTimeout(() => {
          if (!videoReady && videoRef.current?.srcObject) {
            setVideoReady(true);
          }
        }, 2000);
      }
      // modal already shown above
    } catch (err) {
      if (err?.name === "NotAllowedError") {
        setError("Bạn đã từ chối quyền truy cập camera");
      } else if (err?.name === "NotFoundError") {
        setError("Không tìm thấy camera trên thiết bị");
      } else if (err?.name === "NotReadableError") {
        setError("Camera đang được sử dụng bởi ứng dụng khác");
      } else {
        setError(err?.message || "Không thể truy cập camera");
      }
    }
  };

  const closeCameraModal = () => {
    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch (e) {}
    streamRef.current = null;
    setVideoReady(false);
    setShowCameraModal(false);
  };

  const captureFromCamera = async () => {
    try {
      const video = videoRef.current;
      if (!video) {
        setError('Không thể truy cập video element');
        return;
      }

      // Ensure video has loaded proper dimensions
      const w = video.videoWidth;
      const h = video.videoHeight;
      
      if (!w || !h) {
        setError('Camera chưa sẵn sàng. Vui lòng chờ một chút và thử lại.');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setError('Không thể tạo canvas context');
        return;
      }

      ctx.drawImage(video, 0, 0, w, h);
      
      // Verify canvas has content before converting
      const imageData = ctx.getImageData(0, 0, 1, 1);
      if (!imageData || !imageData.data) {
        setError('Không thể chụp ảnh từ camera');
        return;
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      if (!dataUrl || dataUrl.length < 100) {
        setError('Ảnh chụp không hợp lệ');
        return;
      }

      await uploadAvatarFromDataUrl(dataUrl);
      closeCameraModal();
    } catch (err) {
      setError(err?.message || 'Không thể chụp ảnh từ camera');
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
              <div
                role="button"
                tabIndex={0}
                onClick={() => setAvatarMenuOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setAvatarMenuOpen(true);
                  }
                }}
                style={{ width: 88, height: 88, borderRadius: 999, border: "4px solid white", overflow: "hidden", background: "#0d2238", display: "grid", placeItems: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", cursor: "pointer" }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 800, color: "#c9a84c" }}>{initials}</span>
                )}
              </div>
              {avatarMenuOpen && (
                <div className="modal-overlay" onClick={() => setAvatarMenuOpen(false)} style={{ zIndex: 300 }}>
                  <div className="card modal-card" style={{ maxWidth: 480 }} onClick={(event) => event.stopPropagation()}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0, fontWeight: 800, color: "#0d2238" }}>Cập nhật ảnh đại diện</h3>
                      <button type="button" onClick={() => setAvatarMenuOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
                    </div>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Chọn một trong hai cách sau để đổi ảnh đại diện.</p>
                    <div style={{ display: "grid", gap: 10 }}>
                      <button type="button" onClick={handleCameraClick} style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", textAlign: "left", fontWeight: 700 }}>
                        📷 Chụp ảnh từ camera
                      </button>
                      <button type="button" onClick={() => galleryRef.current?.click()} style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", textAlign: "left", fontWeight: 700 }}>
                        🖼️ Chọn từ thư viện
                      </button>
                    </div>
                    {uploading && <div style={{ color: "#64748b", fontSize: 13 }}>Đang cập nhật ảnh đại diện...</div>}
                  </div>
                </div>
              )}
              <input ref={cameraRef} type="file" accept="image/*" capture="user" style={{ display: "none" }} onChange={handleFileChange} />
              <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
              {showCameraModal && (
                <div className="modal-overlay" onClick={closeCameraModal} style={{ zIndex: 400 }}>
                  <div className="card modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontWeight: 800, color: '#0d2238' }}>Chụp ảnh</h3>
                      <button type="button" onClick={closeCameraModal} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', minHeight: 400, position: 'relative', background: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
                      <video 
                        ref={videoRef} 
                        onLoadedMetadata={() => setVideoReady(true)}
                        onCanPlay={() => setVideoReady(true)}
                        onPlay={() => setVideoReady(true)}
                        style={{ width: '100%', height: '100%', background: '#000', objectFit: 'contain' }} 
                        autoPlay 
                        playsInline 
                        muted 
                      />
                      {!videoReady && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', borderRadius: 12 }}>
                          <div style={{ textAlign: 'center', color: '#fff' }}>
                            <div style={{ fontSize: 14, marginBottom: 8 }}>⏳ Đang khởi động camera...</div>
                            <div style={{ fontSize: 12, color: '#cbd5e1' }}>Vui lòng chấp nhận quyền truy cập camera</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                      <button type="button" onClick={closeCameraModal} style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Hủy</button>
                      <button 
                        type="button" 
                        onClick={captureFromCamera} 
                        disabled={!videoReady || uploading}
                        style={{ padding: '8px 12px', borderRadius: 12, border: 'none', background: videoReady && !uploading ? 'linear-gradient(135deg,#c9a84c,#9a7d24)' : '#cbd5e1', color: '#fff', fontWeight: 700, cursor: videoReady && !uploading ? 'pointer' : 'not-allowed', opacity: videoReady && !uploading ? 1 : 0.6 }}>
                        {uploading ? '⏳ Đang lưu...' : '📸 Chụp & Lưu'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, paddingBottom: 4, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={openEdit}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
              >
                ✏️ Thông tin cá nhân
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
            💡 Bấm vào ảnh đại diện để mở lựa chọn chụp ảnh từ camera hoặc tải từ thư viện. Định dạng hỗ trợ: JPG, PNG, WEBP — tối đa 5MB.
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
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
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
    
    {/* ═══ CAMERA PERMISSION MODAL ═══ */}
    {showCameraPermissionModal && (
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "grid", placeItems: "center", padding: 20 }}
        onClick={() => setShowCameraPermissionModal(false)}
      >
        <div
          style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontWeight: 800, color: "#d97706", fontSize: 18 }}>📷 Cấp phép Camera</h3>
            <button type="button" onClick={() => setShowCameraPermissionModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
          </div>
          
          <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
            <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
              Quyền truy cập camera hiện đang chưa được cấp phép. Bạn có muốn cấp quyền sử dụng camera để chụp ảnh đại diện không?
            </p>
            <div style={{ padding: 14, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 12, color: "#92400e", fontSize: 13 }}>
              ⚠️ Bạn cũng có thể quản lý các quyền này trong phần <strong>Cài đặt</strong> của ứng dụng.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowCameraPermissionModal(false)}
              style={{ flex: 1, padding: "11px", borderRadius: 99, border: "1px solid #e2e8f0", background: "white", fontWeight: 600, cursor: "pointer", color: "#0d2238" }}
            >
              Từ chối
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await updateSettings({ allowCamera: true });
                  setShowCameraPermissionModal(false);
                  setTimeout(() => {
                    handleCameraClick(true);
                  }, 100);
                } catch (e) {
                  setError("Không thể cấp quyền");
                }
              }}
              style={{ flex: 1.5, padding: "11px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "white", fontWeight: 700, border: "none", cursor: "pointer" }}
            >
              📷 Cho phép truy cập
            </button>
          </div>
        </div>
      </div>
    )}
    </section>
   
  );
}