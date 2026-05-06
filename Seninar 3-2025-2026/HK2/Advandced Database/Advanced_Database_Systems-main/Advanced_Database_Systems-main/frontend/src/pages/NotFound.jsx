import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="container" style={{ padding: "64px 24px" }}>
      <h1>404</h1>
      <p>Trang ban tim khong ton tai.</p>
      <Link className="btn btn-primary" to="/">Ve trang chu</Link>
    </section>
  );
}
