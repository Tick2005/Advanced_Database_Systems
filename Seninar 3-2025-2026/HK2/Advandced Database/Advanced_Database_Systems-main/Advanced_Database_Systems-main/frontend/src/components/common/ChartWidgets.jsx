import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ─── Revenue trend ──────────────────────────────────────────────────────────
export function RevenueChart({ data = SAMPLE_REVENUE_DATA }) {
  return (
    <div className="card-elevated" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Doanh thu theo tháng</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10 }} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#9a7d24" strokeWidth={2} name="Doanh thu (VND)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Profit by branch ───────────────────────────────────────────────────────
export function ProfitByBranchChart({ data = SAMPLE_BRANCH_DATA }) {
  return (
    <div className="card-elevated" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Lợi nhuận theo chi nhánh</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="branch" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10 }} />
          <Legend />
          <Bar dataKey="profit" fill="#0d2238" name="Lợi nhuận (VND)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="revenue" fill="#9a7d24" name="Doanh thu (VND)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Booking status pie ──────────────────────────────────────────────────────
const STATUS_COLORS = {
  PENDING: "#fbbf24", CONFIRMED: "#60a5fa", CHECKED_IN: "#34d399",
  COMPLETED: "#a78bfa", CANCELLED: "#f87171", HOLD: "#fb923c", PENDING_PAYMENT: "#38bdf8"
};

export function BookingStatusChart({ data = SAMPLE_BOOKING_STATUS }) {
  return (
    <div className="card-elevated" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Phân bố trạng thái đặt phòng</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data} cx="50%" cy="50%" labelLine={false}
            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80} fill="#8884d8" dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={STATUS_COLORS[entry.name] || "#cbd5e1"} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Room availability bar (horizontal) ─────────────────────────────────────
export function RoomAvailabilityBarChart({ data = SAMPLE_ROOM_STATUS_DATA }) {
  return (
    <div className="card-elevated" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Phân bố trạng thái phòng</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" stroke="#64748b" allowDecimals={false} />
          <YAxis type="category" dataKey="roomNumber" stroke="#64748b" width={60} />
          <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10 }} />
          <Bar dataKey="available" name="Trống" fill="#34d399" radius={[0, 6, 6, 0]} />
          <Bar dataKey="occupied" name="Có khách" fill="#60a5fa" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Room status grouped bar (by room type) ─────────────────────────────────
const ST_LABELS = { AVAILABLE: "Trống", HELD: "Tạm giữ", OCCUPIED: "Có khách", MAINTENANCE: "Bảo trì" };
const ST_COLORS = { AVAILABLE: "#34d399", HELD: "#fbbf24", OCCUPIED: "#60a5fa", MAINTENANCE: "#f87171" };

export function RoomStatusGroupBarChart({ rooms = [] }) {
  const map = new Map();
  rooms.forEach((r) => {
    const key = r.roomTypeName || "Không rõ";
    if (!map.has(key)) map.set(key, { type: key, AVAILABLE: 0, HELD: 0, OCCUPIED: 0, MAINTENANCE: 0 });
    const e = map.get(key);
    e[r.status] = (e[r.status] || 0) + 1;
  });
  const chartData = Array.from(map.values());

  return (
    <div className="card-elevated" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Phân bố phòng còn trống theo loại</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="type" stroke="#64748b" />
          <YAxis stroke="#64748b" allowDecimals={false} />
          <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10 }} />
          <Legend />
          {Object.keys(ST_LABELS).map((st) => (
            <Bar key={st} dataKey={st} fill={ST_COLORS[st]} name={ST_LABELS[st]} radius={[4, 4, 0, 0]} stackId="a" />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Occupancy rate line ─────────────────────────────────────────────────────
export function OccupancyRateChart({ data = SAMPLE_OCCUPANCY_DATA }) {
  return (
    <div className="card-elevated" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Tỷ lệ lấp đầy phòng</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" />
          <YAxis stroke="#64748b" domain={[0, 100]} label={{ value: "%", angle: -90, position: "insideLeft" }} />
          <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10 }} formatter={(v) => `${v}%`} />
          <Legend />
          <Line type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={2} name="Tỷ lệ (%)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Sample data ─────────────────────────────────────────────────────────────
const SAMPLE_REVENUE_DATA = [
  { month: "T1", revenue: 45000000 }, { month: "T2", revenue: 52000000 },
  { month: "T3", revenue: 48000000 }, { month: "T4", revenue: 61000000 },
  { month: "T5", revenue: 55000000 }, { month: "T6", revenue: 67000000 }
];

const SAMPLE_BRANCH_DATA = [
  { branch: "TP.HCM", revenue: 120000000, profit: 36000000 },
  { branch: "Hà Nội", revenue: 95000000, profit: 28500000 },
  { branch: "Đà Nẵng", revenue: 85000000, profit: 25500000 },
  { branch: "Hải Phòng", revenue: 62000000, profit: 18600000 }
];

const SAMPLE_BOOKING_STATUS = [
  { name: "PENDING", value: 18 }, { name: "CONFIRMED", value: 42 },
  { name: "CHECKED_IN", value: 35 }, { name: "COMPLETED", value: 78 },
  { name: "CANCELLED", value: 5 }
];

const SAMPLE_OCCUPANCY_DATA = [
  { date: "T2", rate: 75 }, { date: "T3", rate: 82 }, { date: "T4", rate: 68 },
  { date: "T5", rate: 85 }, { date: "T6", rate: 92 }, { date: "T7", rate: 95 }, { date: "CN", rate: 88 }
];

const SAMPLE_ROOM_STATUS_DATA = [
  { roomNumber: "101", available: 1, occupied: 0 }, { roomNumber: "102", available: 0, occupied: 1 },
  { roomNumber: "201", available: 1, occupied: 0 }, { roomNumber: "301", available: 0, occupied: 1 }
];
