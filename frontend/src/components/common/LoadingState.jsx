import SkeletonBlock from "./SkeletonBlock";

export default function LoadingState({ text = "Dang tai..." }) {
  return (
    <div className="container page-shell" role="status" aria-live="polite" aria-busy="true">
      <div className="card card-elevated" style={{ padding: 28, display: "grid", gap: 14 }}>
        <div className="pill pill-soft" style={{ width: "fit-content" }}>Đang xử lý</div>
        <div>{text}</div>
        <SkeletonBlock rows={4} />
      </div>
    </div>
  );
}
