/**
 * BranchMapPanel
 *
 * Hiển thị bản đồ Google Maps embed cho chi nhánh đang được chọn.
 * Khi người dùng chọn chi nhánh khác, chỉ cập nhật src của iframe
 * (KHÔNG thay đổi key) để tránh reload toàn trang.
 */
import { useMemo, useRef, useEffect } from "react";

/**
 * Tạo URL Google Maps embed từ địa chỉ chi nhánh.
 * Ưu tiên dùng tọa độ GPS nếu có, fallback về địa chỉ text.
 */
function buildMapSrc(branch) {
  if (!branch) return "";
  const query = branch.latitude && branch.longitude
    ? `${branch.latitude},${branch.longitude}`
    : [branch.address, branch.city, "Vietnam"].filter(Boolean).join(", ");
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

export default function BranchMapPanel({ branches = [], selectedBranchId, onSelect }) {
  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId) || branches[0] || null,
    [branches, selectedBranchId]
  );

  // Ref to the iframe — we update src directly to avoid remount/reload
  const iframeRef = useRef(null);
  const mapSrc = useMemo(() => buildMapSrc(selectedBranch), [selectedBranch]);

  // Update iframe src without remounting (no key change)
  useEffect(() => {
    if (iframeRef.current && mapSrc) {
      iframeRef.current.src = mapSrc;
    }
  }, [mapSrc]);

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1.6fr) minmax(240px, 0.8fr)" }}>
      {/* ── Map iframe ── */}
      <div style={{ borderRadius: 18, overflow: "hidden", minHeight: 360, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", position: "relative" }}>
        {selectedBranch ? (
          <>
            {/* Branch name overlay */}
            <div style={{
              position: "absolute", top: 12, left: 12, zIndex: 2,
              background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
              padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#0d2238" }}>{selectedBranch.name}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                📍 {selectedBranch.address ? `${selectedBranch.address}, ` : ""}{selectedBranch.city || "Vietnam"}
              </div>
            </div>
            <iframe
              ref={iframeRef}
              title={`map-${selectedBranch.id}`}
              src={mapSrc}
              style={{ width: "100%", height: "100%", minHeight: 360, border: 0, display: "block" }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </>
        ) : (
          <div style={{ height: 360, display: "grid", placeItems: "center", color: "#94a3b8", fontSize: 14 }}>
            Chưa có chi nhánh để hiển thị
          </div>
        )}
      </div>

      {/* ── Branch list ── */}
      <aside style={{ display: "grid", gap: 8, alignContent: "start", maxHeight: 400, overflowY: "auto" }}>
        {branches.map((branch) => {
          const active = selectedBranch?.id === branch.id;
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => onSelect?.(branch.id)}
              style={{
                textAlign: "left",
                display: "grid",
                gap: 3,
                padding: "12px 14px",
                borderRadius: 14,
                border: active ? "1.5px solid #c9a84c" : "1px solid #e2e8f0",
                background: active ? "#fffbeb" : "#fff",
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: active ? "0 2px 12px rgba(201,168,76,0.15)" : "none",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = "#c9a84c"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <span style={{ fontWeight: 700, fontSize: 14, color: "#0d2238" }}>{branch.name}</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {branch.address ? `${branch.address}, ` : ""}{branch.city}
              </span>
              {branch.phone && (
                <span style={{ fontSize: 11, color: "#94a3b8" }}>📞 {branch.phone}</span>
              )}
            </button>
          );
        })}
      </aside>
    </div>
  );
}
