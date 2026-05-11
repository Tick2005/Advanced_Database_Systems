import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useCameraProfile
 *
 * Quản lý toàn bộ vòng đời camera: xin quyền, preview, chụp ảnh, dọn stream.
 * Tách riêng khỏi Profile.jsx để tái sử dụng ở bất kỳ trang nào cần camera.
 *
 * Trả về:
 *  - videoRef          : ref gắn vào <video>
 *  - streamRef         : ref stream đang chạy (dùng khi cần dừng thủ công)
 *  - isOpen            : modal camera đang hiện?
 *  - isReady           : video đã load metadata và có thể chụp?
 *  - isCapturing       : đang xử lý canvas?
 *  - permissionDenied  : người dùng từ chối quyền camera?
 *  - error             : thông báo lỗi (string)
 *  - openCamera()      : bắt đầu stream và hiện modal
 *  - closeCamera()     : tắt stream và đóng modal
 *  - capture()         : chụp 1 frame → trả về { dataUrl, blob } | null
 *  - clearError()      : xoá error
 */
export function useCameraProfile({ enabled = true } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState("");

  // Dọn stream khi unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopStream() {
    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch (_) {}
    streamRef.current = null;
  }

  const openCamera = useCallback(async () => {
    setError("");
    setPermissionDenied(false);

    if (!enabled) {
      setError("Quyền truy cập camera chưa được bật trong cài đặt.");
      return;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setError("Trình duyệt không hỗ trợ truy cập camera.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      // Gắn stream vào video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (_) {}
      }

      setIsReady(false);
      setIsOpen(true);
    } catch (err) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setPermissionDenied(true);
        setError("Bạn đã từ chối quyền truy cập camera. Vui lòng bật lại trong trình duyệt hoặc cài đặt ứng dụng.");
      } else if (err?.name === "NotFoundError") {
        setError("Không tìm thấy camera trên thiết bị.");
      } else if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
        setError("Camera đang được ứng dụng khác sử dụng. Vui lòng đóng các ứng dụng đó và thử lại.");
      } else if (err?.name === "OverconstrainedError") {
        // Thử lại không có constraint
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            try { await videoRef.current.play(); } catch (_) {}
          }
          setIsReady(false);
          setIsOpen(true);
          return;
        } catch (fallbackErr) {
          setError(fallbackErr?.message || "Không thể khởi động camera.");
        }
      } else {
        setError(err?.message || "Không thể truy cập camera.");
      }
    }
  }, [enabled]);

  const closeCamera = useCallback(() => {
    stopStream();
    setIsOpen(false);
    setIsReady(false);
    setIsCapturing(false);
  }, []);

  const markReady = useCallback(() => {
    setIsReady(true);
  }, []);

  /**
   * capture() → { dataUrl: string, blob: Blob } | null
   * Trả về null nếu camera chưa sẵn sàng hoặc có lỗi.
   */
  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isReady) {
      setError("Camera chưa sẵn sàng. Vui lòng đợi video tải xong.");
      return null;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setError("Không thể đọc kích thước video. Camera chưa sẵn sàng.");
      return null;
    }

    setIsCapturing(true);
    setError("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Không thể tạo canvas context.");
        setIsCapturing(false);
        return null;
      }

      ctx.drawImage(video, 0, 0, w, h);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      if (!dataUrl || dataUrl.length < 100) {
        setError("Ảnh chụp không hợp lệ.");
        setIsCapturing(false);
        return null;
      }

      // Chuyển dataUrl → Blob để có thể dùng FormData nếu cần
      const byteString = atob(dataUrl.split(",")[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: "image/jpeg" });

      setIsCapturing(false);
      return { dataUrl, blob };
    } catch (err) {
      setError(err?.message || "Không thể chụp ảnh từ camera.");
      setIsCapturing(false);
      return null;
    }
  }, [isReady]);

  const clearError = useCallback(() => setError(""), []);

  return {
    videoRef,
    streamRef,
    isOpen,
    isReady,
    isCapturing,
    permissionDenied,
    error,
    openCamera,
    closeCamera,
    markReady,
    capture,
    clearError,
  };
}
