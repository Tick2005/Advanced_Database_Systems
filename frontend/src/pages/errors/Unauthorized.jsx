import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <section className="container" style={{ padding: "64px 24px" }}>
      <h1>401 Unauthorized</h1>
      <p>Vui long dang nhap de tiep tuc.</p>
      <Link className="btn btn-primary" to="/login">Dang nhap</Link>
    </section>
  );
}
