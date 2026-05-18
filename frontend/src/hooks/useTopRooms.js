/**
 * useTopRooms.js
 *
 * Hook quản lý top rooms với location reactive:
 * - Dùng navigator.geolocation.watchPosition để nhận update liên tục
 *   khi user di chuyển hoặc cấp quyền lần đầu — không cần reload trang.
 * - Khi lat/lng thay đổi, React Query tự refetch ngay lập tức (staleTime: 0).
 * - Fallback về rating-only nếu không có location hoặc user không cho phép.
 */
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { roomService } from "../features/rooms/roomService";
import { loadLocationFromStorage, saveLocationToStorage } from "../services/geo";

const TOP_ROOMS_QUERY_KEY = (lat, lng) => ["top-rooms", lat ?? null, lng ?? null];

export function useTopRooms({ allowLocation = false, limit = 4 } = {}) {
  const queryClient = useQueryClient();

  // Khởi tạo từ storage để hiển thị ngay lập tức nếu đã có location cũ
  const [location, setLocation] = useState(() => loadLocationFromStorage());
  const watchIdRef = useRef(null);

  useEffect(() => {
    // Dọn dẹp watch cũ nếu allowLocation thay đổi
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!allowLocation || !navigator.geolocation) {
      return;
    }

    const onSuccess = (position) => {
      const newLoc = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setLocation((prev) => {
        // Chỉ update nếu thực sự thay đổi (tránh re-render thừa)
        if (
          prev?.latitude === newLoc.latitude &&
          prev?.longitude === newLoc.longitude
        ) {
          return prev;
        }
        saveLocationToStorage(newLoc);
        // Dispatch event để các component khác (Home.jsx) cũng biết
        try {
          window.dispatchEvent(
            new CustomEvent("user_location_updated", { detail: newLoc })
          );
        } catch (_) {}
        return newLoc;
      });
    };

    const onError = () => {
      // Không xóa location cũ — vẫn dùng giá trị từ storage
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [allowLocation]);

  const lat = allowLocation && location?.latitude  ? location.latitude  : undefined;
  const lng = allowLocation && location?.longitude ? location.longitude : undefined;

  const query = useQuery({
    queryKey: TOP_ROOMS_QUERY_KEY(lat, lng),
    queryFn: () => roomService.getTopRooms({ latitude: lat, longitude: lng, limit }),
    staleTime: 0,          // luôn refetch khi key thay đổi (location mới)
    gcTime: 5 * 60 * 1000, // giữ cache 5 phút
    refetchOnWindowFocus: false,
  });

  return {
    topRooms: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    hasLocation: Boolean(lat && lng),
  };
}
