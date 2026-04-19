import { useEffect, useState } from "react";
import { branchService } from "../features/branches/branchService";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [error, setError] = useState("");

  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) || branches[0] || null;
  const mapQuery = selectedBranch
    ? [selectedBranch.address, selectedBranch.city, selectedBranch.country].filter(Boolean).join(", ") || selectedBranch.name
    : "Vietnam";
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  useEffect(() => {
    branchService
      .getBranches()
      .then((data) => {
        const list = data || [];
        setBranches(list);
        if (list.length > 0) {
          setSelectedBranchId(list[0].id);
        }
      })
      .catch((err) => {
        setError(err.message || "Không thể tải danh sách chi nhánh");
      });
  }, []);

  return (
    <section className="container page-shell">
      <div className="page-heading">
        <h1>Chi nhánh của LuxStay</h1>
        <p>Chọn một chi nhánh để xem bản đồ thật và thông tin chi tiết.</p>
      </div>
      {error && <div style={{ padding: "12px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, marginBottom: 12 }}>{error}</div>}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
        <aside className="card-elevated" style={{ padding: 14, display: "grid", gap: 10, alignContent: "start" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, letterSpacing: "0.08em" }}>DANH SÁCH CHI NHÁNH</div>
          {branches.map((branch) => {
            const active = selectedBranch?.id === branch.id;
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedBranchId(branch.id)}
                style={{
                  textAlign: "left",
                  display: "grid",
                  gap: 2,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: active ? "1px solid #c9a84c" : "1px solid #e2e8f0",
                  background: active ? "#fffaf0" : "#fff",
                  cursor: "pointer"
                }}
              >
                <span style={{ fontWeight: 600, color: "#0d2238" }}>{branch.name}</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>{branch.city}</span>
              </button>
            );
          })}
        </aside>

        <article className="card-elevated" style={{ padding: 12, display: "grid", gap: 12 }}>
          <div className="card" style={{ overflow: "hidden", minHeight: 300 }}>
            <iframe
              title={`branch-map-${selectedBranch?.id || "default"}`}
              src={mapSrc}
              style={{ border: 0, width: "100%", height: "100%", minHeight: 300 }}
              loading="lazy"
            />
          </div>

          <div style={{ display: "grid", gap: 10, padding: "0 4px 6px" }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#0d2238" }}>{selectedBranch?.name || "Chi nhánh"}</div>
              <span className="pill pill-soft" style={{ marginTop: 6, width: "fit-content" }}>{selectedBranch?.city || ""}</span>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gap: 2 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>ĐỊA CHỈ</span>
                <span style={{ fontSize: 14 }}>{selectedBranch?.address || "Đang cập nhật"}</span>
              </div>
              <div style={{ display: "grid", gap: 2 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>HOTLINE</span>
                {selectedBranch?.phone ? (
                  <a href={`tel:${selectedBranch.phone}`} style={{ fontSize: 14, color: "#9a7d24", textDecoration: "none", fontWeight: 500 }}>{selectedBranch.phone}</a>
                ) : (
                  <span style={{ fontSize: 14 }}>Đang cập nhật</span>
                )}
              </div>
              {selectedBranch?.email && (
                <div style={{ display: "grid", gap: 2 }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>EMAIL</span>
                  <a href={`mailto:${selectedBranch.email}`} style={{ fontSize: 14, color: "#9a7d24", textDecoration: "none", fontWeight: 500 }}>{selectedBranch.email}</a>
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, color: "#475569", fontSize: 13 }}>
              {selectedBranch
                ? `Chi nhánh ${selectedBranch.name} là điểm vận hành trọng tâm tại ${selectedBranch.city || "khu vực"}, cung cấp đầy đủ dịch vụ lưu trú và hỗ trợ trực tiếp cho khách hàng.`
                : "Chọn chi nhánh để xem thông tin chi tiết."}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
