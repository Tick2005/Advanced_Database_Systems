// Unified dashboard styling for consistent UI across staff, manager, owner pages

export const dashboardStyles = {
  // Headers
  headerGradient: {
    padding: "20px 24px",
    borderRadius: 16,
    background: "linear-gradient(135deg, rgba(13, 34, 56, 0.85) 0%, rgba(30, 58, 95, 0.9) 100%)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    transition: "all 0.3s ease",
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
    padding: 18,
    borderRadius: 16,
    background: "rgba(255, 255, 255, 0.65)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    boxShadow: "0 4px 24px rgba(13, 34, 56, 0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
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
    padding: 20,
    borderRadius: 16,
    background: "rgba(255, 255, 255, 0.65)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    boxShadow: "0 8px 32px rgba(13, 34, 56, 0.04)",
  },

  // Lists and items
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    borderRadius: 12,
    background: "rgba(248, 250, 252, 0.6)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(226, 232, 240, 0.6)",
    transition: "background 0.2s ease, transform 0.2s ease",
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
    padding: 16,
    borderRadius: 14,
    background: "rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.6)",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
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
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
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
