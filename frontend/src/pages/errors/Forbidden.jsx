import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <section className="container" style={{ padding: "64px 24px" }}>
      <h1>403 Forbidden</h1>
      <p>Ban khong co quyen truy cap tai nguyen nay.</p>
      <Link className="btn btn-primary" to="/">Ve trang chu</Link>
    </section>
  );
}
