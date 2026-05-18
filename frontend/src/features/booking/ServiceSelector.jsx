import { useState, useEffect } from "react";
import { serviceService } from "../services/serviceService";
import { formatCurrencyVnd } from "../../services/presenters";

export default function ServiceSelector({ branchId, onServicesChange = () => {} }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!branchId) {
      setServices([]);
      setError("");
      onServicesChange([]);
      return;
    }

    setLoading(true);
    setError("");

    serviceService
      .getPublicServicesByBranch(branchId)
      .then((data) => {
        const mapped = (data || [])
          .filter((item) => item?.active !== false)
          .map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price || 0),
            description: item.description || "Dịch vụ bổ sung cho lưu trú của bạn",
            selected: false
          }));
        setServices(mapped);
        onServicesChange([]);
      })
      .catch((err) => {
        setServices([]);
        setError(err.message || "Không thể tải danh sách dịch vụ");
        onServicesChange([]);
      })
      .finally(() => setLoading(false));
  }, [branchId, onServicesChange]);

  const toggleService = (id) => {
    const updated = services.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s));
    setServices(updated);
    onServicesChange(updated.filter((s) => s.selected));
  };

  const selectedTotal = services.filter((s) => s.selected).reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="card-elevated" style={{ padding: 18, display: "grid", gap: 14 }}>
      <div>
        <h3 style={{ margin: 0, marginBottom: 4 }}>Dịch vụ thêm</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Tùy chọn các dịch vụ bổ sung cho lưu trú của bạn</p>
      </div>

      {loading && <div style={{ fontSize: 13, color: "#64748b" }}>Đang tải dịch vụ...</div>}
      {error && <div style={{ fontSize: 13, color: "#b91c1c" }}>{error}</div>}
      {!loading && !error && services.length === 0 && (
        <div style={{ fontSize: 13, color: "#64748b" }}>Chi nhánh hiện chưa có dịch vụ bổ sung.</div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {services.map((service) => (
          <label key={service.id} style={{ display: "flex", gap: 12, padding: "12px", background: service.selected ? "#f0f4ff" : "#f8fafc", borderRadius: 12, cursor: "pointer", transition: "all 0.2s", border: service.selected ? "1px solid #c9a84c" : "1px solid #e2e8f0" }}>
            <input type="checkbox" checked={service.selected} onChange={() => toggleService(service.id)} style={{ marginTop: 2, accentColor: "#9a7d24" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{service.name}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{service.description}</div>
            </div>
            <div style={{ fontWeight: 700, color: "#9a7d24", whiteSpace: "nowrap" }}>
              +{formatCurrencyVnd(service.price)}
            </div>
          </label>
        ))}
      </div>

      {selectedTotal > 0 && (
        <div style={{ padding: "12px 14px", background: "#f0f4ff", borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#64748b" }}>Tổng dịch vụ:</span>
          <span style={{ fontWeight: 700, color: "#9a7d24" }}>{formatCurrencyVnd(selectedTotal)}</span>
        </div>
      )}
    </div>
  );
}
