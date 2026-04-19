import { Link } from "react-router-dom";
import { formatCurrencyVnd, formatStatus, getRoomImage, getStatusStyle } from "../../services/presenters";

export default function RoomCard({ room, detailPath, actionLabel = "Xem chi tiet" }) {
  const statusStyle = getStatusStyle(room.status);

  return (
    <article className="room-card">
      <div className="room-card-media">
        <img
          src={getRoomImage(room)}
          alt={room.roomTypeName || "Room"}
          loading="lazy"
        />
      </div>
      <div className="room-card-body">
        <div className="room-badges">
          <span className="pill pill-soft">{room.branchCity || "N/A"}</span>
          <span className="pill" style={{ background: statusStyle.bg, color: statusStyle.color }}>{formatStatus(room.status)}</span>
        </div>
        <strong style={{ fontSize: 18 }}>{room.roomTypeName || "Room"} · {room.roomNumber}</strong>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ color: "#64748b" }}>{room.maxOccupancy || 0} khách tối đa</span>
          <span className="room-price">{formatCurrencyVnd(room.rate)} / đêm</span>
        </div>
        <Link className="btn btn-primary" to={detailPath.replace(":id", room.id)}>{actionLabel}</Link>
      </div>
    </article>
  );
}
