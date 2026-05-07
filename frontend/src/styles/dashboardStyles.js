// Unified dashboard styling for consistent UI across staff, manager, owner pages

export const dashboardStyles = {
  // Headers
  headerGradient: {
    padding: "16px 20px",
    borderRadius: 14,
    background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  headerTitle: {
    fontWeight: 800,
    fontSize: 20,
  },

  headerSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },

  headerDescription: {
    fontSize: 13,
    opacity: 0.75,
    marginTop: 2,
  },

  headerDate: {
    textAlign: "right",
    fontSize: 13,
    opacity: 0.8,
  },

  // Summary cards
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    background: "white",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  summaryCardLabel: {
    color: "#64748b",
    fontSize: 12,
    marginBottom: 6,
    fontWeight: 600,
  },

  summaryCardValue: {
    fontSize: 30,
    fontWeight: 800,
    color: "#0d2238",
  },

  summaryCardIcon: {
    fontSize: 26,
    flexShrink: 0,
  },

  // Cards and sections
  cardContainer: {
    padding: 16,
    borderRadius: 12,
    background: "white",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },

  // Lists and items
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  listItemHighlight: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
  },

  // Buttons
  buttonGroup: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  // Filters
  filterContainer: {
    padding: 14,
    borderRadius: 12,
    background: "white",
    border: "1px solid #e2e8f0",
    display: "grid",
    gap: 12,
  },

  filterRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },

  // Modals
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "grid",
    placeItems: "center",
    zIndex: 100,
    padding: 20,
  },

  modalCard: {
    maxWidth: 500,
    width: "100%",
    background: "white",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
  },

  // Form controls
  formField: {
    display: "grid",
    gap: 6,
    marginBottom: 12,
  },

  formLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
  },

  formInput: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    boxSizing: "border-box",
  },

  formTextarea: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 13,
    resize: "vertical",
    boxSizing: "border-box",
  },

  // Charts and data visualization
  chartContainer: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
  },

  // Colors for status/rating
  colorSuccess: "#10b981",
  colorWarning: "#f59e0b",
  colorError: "#ef4444",
  colorInfo: "#3b82f6",
  colorGold: "#9a7d24",
  colorPrimary: "#0d2238",

  // Utility
  flexBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  gridAuto: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
  },

  gridSection: {
    display: "grid",
    gap: 16,
  },
};

// Helper function to merge styles
export function mergeStyles(...styles) {
  return Object.assign({}, ...styles);
}
