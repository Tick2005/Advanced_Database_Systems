import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Revenue trend (sample data)
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

// Profit by branch (sample data)
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

// Booking status distribution
export function BookingStatusChart({ data = SAMPLE_BOOKING_STATUS }) {
  const COLORS = {
    PENDING: "#fbbf24",
    CONFIRMED: "#60a5fa",
    CHECKED_IN: "#34d399",
    COMPLETED: "#a78bfa",
    CANCELLED: "#f87171"
  };

  return (
    <div className="card-elevated" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Phân bố trạng thái đặt phòng</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#cbd5e1"} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Room occupancy rate
export function OccupancyRateChart({ data = SAMPLE_OCCUPANCY_DATA }) {
  return (
    <div className="card-elevated" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Tỷ lệ lấp đầy phòng</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" />
          <YAxis stroke="#64748b" domain={[0, 100]} label={{ value: "%", angle: -90, position: "insideLeft" }} />
          <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10 }} formatter={(value) => `${value}%`} />
          <Legend />
          <Line type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={2} name="Tỷ lệ (%)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sample data
const SAMPLE_REVENUE_DATA = [
  { month: "Tháng 1", revenue: 45000000 },
  { month: "Tháng 2", revenue: 52000000 },
  { month: "Tháng 3", revenue: 48000000 },
  { month: "Tháng 4", revenue: 61000000 },
  { month: "Tháng 5", revenue: 55000000 },
  { month: "Tháng 6", revenue: 67000000 }
];

const SAMPLE_BRANCH_DATA = [
  { branch: "TP.HCM", revenue: 120000000, profit: 36000000 },
  { branch: "Hà Nội", revenue: 95000000, profit: 28500000 },
  { branch: "Đà Nẵng", revenue: 85000000, profit: 25500000 },
  { branch: "Hải Phòng", revenue: 62000000, profit: 18600000 }
];

const SAMPLE_BOOKING_STATUS = [
  { name: "PENDING", value: 18 },
  { name: "CONFIRMED", value: 42 },
  { name: "CHECKED_IN", value: 35 },
  { name: "COMPLETED", value: 78 },
  { name: "CANCELLED", value: 5 }
];

const SAMPLE_OCCUPANCY_DATA = [
  { date: "Thứ 2", rate: 75 },
  { date: "Thứ 3", rate: 82 },
  { date: "Thứ 4", rate: 68 },
  { date: "Thứ 5", rate: 85 },
  { date: "Thứ 6", rate: 92 },
  { date: "Thứ 7", rate: 95 },
  { date: "Chủ nhật", rate: 88 }
];
