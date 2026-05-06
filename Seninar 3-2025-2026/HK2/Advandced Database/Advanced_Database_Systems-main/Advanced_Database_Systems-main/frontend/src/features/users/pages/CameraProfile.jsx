// commit: feat(camera-profile): tích hợp trang quản lý cấu hình camera — liệt kê thiết bị, preview, lưu profile
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/pathConstants";
import ToastMessage from "../../../components/common/ToastMessage";

const STORAGE_KEY = "luxstay.camera.deviceId";

// ─── Helper: enumerate camera devices ────────────────────────────────────────

async function listCameras() {
  if (!navigator?.mediaDevices?.enumerateDevices) return [];
  try {
    // Request permission first to get labelled devices
    await navigator.mediaDevices.getUserMedia({ video: true }).then((s) => {
      s.getTracks().forEach((t) => t.stop());
    });
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === "videoinput")
      .map((d, idx) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${idx + 1}`,
      }));
  } catch {
    return [];
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

function PermissionBanner({ status }) {
  if (status === "granted") return null;
  const isBlocked = status === "denied";
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 10,
        background: isBlocked ? "#fee2e2" : "#fef9c3",
        color: isBlocked ? "#b91c1c" : "#854d0e",
        fontSize: 14,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 18 }}>{isBlocked ? "🚫" : "⚠️"}</span>
      <div>
        {isBlocked
          ? "Truy cập camera bị chặn. Hãy mở quyền trong cài đặt trình duyệt rồi tải lại trang."
          : "Cần cấp quyền camera để xem và chọn thiết bị. Nhấn 'Tải thiết bị' để bắt đầu."}
      </div>
    </div>
  );
}

function DeviceSelector({ devices, selected, onChange }) {
  if (!devices.length) {
    return (
      <p style={{ color: "#64748b", fontSize: 14 }}>
        Không tìm thấy thiết bị camera nào. Đảm bảo camera đã kết nối.
      </p>
    );
  }
  return (
    <div className="field">
      <label style={{ fontSize: 14, fontWeight: 600 }}>Thiết bị camera</label>
      <select value={selected} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Mặc định của hệ thống —</option>
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PreviewPanel({ videoRef, active, videoReady }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 360,
        aspectRatio: "4/3",
        background: "#0f172a",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: active && videoReady ? "block" : "none",
        }}
      />
      {!active && (
        <span style={{ color: "#64748b", fontSize: 13 }}>Preview không hoạt động</span>
      )}
      {active && !videoReady && (
        <span style={{ color: "#94a3b8", fontSize: 13 }}>Đang khởi tạo camera...</span>
      )}
      {active && videoReady && (
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "#ef4444",
            width: 8,
            height: 8,
            borderRadius: 99,
            boxShadow: "0 0 0 2px rgba(255,255,255,0.5)",
          }}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CameraProfile() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  const [permissionStatus, setPermissionStatus] = useState("unknown"); // unknown | granted | denied | prompt
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ""
  );
  const [previewActive, setPreviewActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Check permission state on mount
  useEffect(() => {
    if (navigator?.permissions?.query) {
      navigator.permissions
        .query({ name: "camera" })
        .then((result) => {
          setPermissionStatus(result.state); // granted | denied | prompt
          result.onchange = () => setPermissionStatus(result.state);
        })
        .catch(() => setPermissionStatus("unknown"));
    }
  }, []);

  // Stop stream helper
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setPreviewActive(false);
    setVideoReady(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopStream(), [stopStream]);

  // Load camera list
  const handleLoadDevices = async () => {
    setLoadingDevices(true);
    setErrorMsg("");
    const list = await listCameras();
    setLoadingDevices(false);
    if (!list.length) {
      setPermissionStatus("denied");
      setErrorMsg("Không thể truy cập camera. Kiểm tra quyền trình duyệt.");
    } else {
      setPermissionStatus("granted");
      setDevices(list);
      // Validate saved deviceId
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && !list.some((d) => d.deviceId === saved)) {
        setSelectedDeviceId("");
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  // Start/stop preview
  const togglePreview = async () => {
    if (previewActive) {
      stopStream();
      return;
    }
    setErrorMsg("");
    try {
      const constraints = {
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setVideoReady(true);
      }
      setPreviewActive(true);
    } catch (err) {
      setErrorMsg(err?.message || "Không thể khởi động camera.");
    }
  };

  // Restart preview when device changes
  const handleDeviceChange = (deviceId) => {
    setSelectedDeviceId(deviceId);
    if (previewActive) {
      stopStream();
    }
  };

  // Save profile
  const handleSave = () => {
    try {
      if (selectedDeviceId) {
        localStorage.setItem(STORAGE_KEY, selectedDeviceId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      const selected = devices.find((d) => d.deviceId === selectedDeviceId);
      setSuccessMsg(
        selected
          ? `Đã lưu camera: ${selected.label}`
          : "Đã đặt lại về camera mặc định hệ thống."
      );
    } catch {
      setErrorMsg("Không thể lưu cấu hình camera.");
    }
  };

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 640, display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "grid", gap: 6 }}>
        <h1 style={{ margin: 0 }}>Camera Profile</h1>
        <p style={{ margin: 0, color: "#64748b" }}>
          Chọn camera ưu tiên và kiểm tra preview trước khi sử dụng.
        </p>
      </div>

      <PermissionBanner status={permissionStatus} />

      {/* Device selection card */}
      <article className="card" style={{ padding: 20, display: "grid", gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>Thiết bị & cấu hình</h3>

        {permissionStatus !== "granted" && !devices.length ? (
          <button
            className="btn btn-primary"
            onClick={handleLoadDevices}
            disabled={loadingDevices}
            style={{ alignSelf: "start" }}
          >
            {loadingDevices ? "Đang tải..." : "Tải danh sách thiết bị"}
          </button>
        ) : (
          <>
            {!devices.length && (
              <button
                className="btn btn-primary"
                onClick={handleLoadDevices}
                disabled={loadingDevices}
                style={{ alignSelf: "start" }}
              >
                {loadingDevices ? "Đang tải..." : "Làm mới danh sách"}
              </button>
            )}
            <DeviceSelector
              devices={devices}
              selected={selectedDeviceId}
              onChange={handleDeviceChange}
            />
            {devices.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-gold" onClick={handleSave}>
                  Lưu camera profile
                </button>
                <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={handleLoadDevices} disabled={loadingDevices}>
                  Làm mới
                </button>
              </div>
            )}
          </>
        )}
      </article>

      {/* Preview card */}
      {permissionStatus === "granted" && (
        <article className="card" style={{ padding: 20, display: "grid", gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Preview camera</h3>
          <PreviewPanel videoRef={videoRef} active={previewActive} videoReady={videoReady} />
          <div>
            <button
              className={`btn ${previewActive ? "" : "btn-primary"}`}
              style={previewActive ? { border: "1px solid #cbd5e1", background: "white" } : {}}
              onClick={togglePreview}
            >
              {previewActive ? "Dừng preview" : "Bắt đầu preview"}
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
            Preview chỉ để kiểm tra — không ghi âm hay lưu trữ hình ảnh.
          </p>
        </article>
      )}

      {/* Nav */}
      <div style={{ display: "flex", gap: 10 }}>
        <Link className="btn pill pill-soft" to={PATHS.CUSTOMER_SETTINGS}>← Về cài đặt</Link>
      </div>

      <ToastMessage type="success" message={successMsg} onClose={() => setSuccessMsg("")} />
      <ToastMessage type="error" message={errorMsg} onClose={() => setErrorMsg("")} />
    </section>
  );
}
