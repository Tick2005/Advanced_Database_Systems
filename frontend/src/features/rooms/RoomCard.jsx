import { Link } from "react-router-dom";
import RatingStars from "../../components/common/RatingStars";
import { formatCurrencyVndPerNight, formatStatus, getRoomImage, getStatusStyle } from "../../services/presenters";

export default function RoomCard({ room, detailPath, actionLabel = "Xem chi tiet" }) {
  const statusStyle = getStatusStyle(room.status);
  const averageRating = Number(room.averageRating || 0);

  // Dùng effectiveRate nếu có (đã áp pricing_season), fallback về rate gốc
  const displayRate = room.effectiveRate != null ? Number(room.effectiveRate) : Number(room.rate || 0);
  const baseRate = Number(room.rate || 0);
  const hasDiscount = room.effectiveRate != null && Math.abs(displayRate - baseRate) > 1;
  const isIncrease = hasDiscount && displayRate > baseRate;

  return (
    <article className="room-card">
      <div className="room-card-media">
        <img
          src={getRoomImage(room)}
          alt={room.roomTypeName || "Room"}
          loading="lazy"
        />
        {/* Badge season nếu có */}
        {hasDiscount && room.activeSeasonName && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: isIncrease ? "#fee2e2" : "#dcfce7",
            color: isIncrease ? "#b91c1c" : "#16a34a",
          }}>
            {isIncrease
              ? `+${Math.abs(Number(room.activeDiscountPercent || 0))}%`
              : `-${Math.abs(Number(room.activeDiscountPercent || 0))}%`
            } {room.activeSeasonName}
          </div>
        )}
      </div>
      <div className="room-card-body">
        <div className="room-badges">
          <span className="pill pill-soft">{room.branchCity || "N/A"}</span>
          <span className="pill" style={{ background: statusStyle.bg, color: statusStyle.color }}>{formatStatus(room.status)}</span>
        </div>
        <strong style={{ fontSize: 18 }}>{room.roomTypeName || "Room"} · {room.roomNumber}</strong>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ color: "#64748b" }}>{room.maxOccupancy || 0} khách tối đa</span>
          <div style={{ textAlign: "right" }}>
            {/* Giá hiệu lực (sau season) */}
            <span className="room-price">{formatCurrencyVndPerNight(displayRate)}</span>
            {/* Giá gốc bị gạch nếu có season */}
            {hasDiscount && (
              <div style={{ fontSize: 11, color: "#94a3b8", textDecoration: "line-through" }}>
                {formatCurrencyVndPerNight(baseRate)}
              </div>
            )}
          </div>
        </div>
        <RatingStars value={averageRating} size={14} showValue />
        <Link className="btn btn-primary" to={detailPath.replace(":id", room.id)}>{actionLabel}</Link>
      </div>
    </article>
  );
}
