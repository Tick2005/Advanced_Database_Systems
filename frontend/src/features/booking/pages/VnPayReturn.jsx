import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentService } from "../paymentService";
import { PATHS } from "../../../routes/pathConstants";

export default function VnPayReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const query = location.search.startsWith("?") ? location.search.slice(1) : location.search;
        const data = await paymentService.verifyVnPayReturn(query);
        const success = data.responseCode === "00";
        navigate(success ? PATHS.CUSTOMER_BOOKING_SUCCESS : PATHS.CUSTOMER_BOOKING_FAILED, {
          replace: true,
          state: { result: data }
        });
      } catch (err) {
        setError(err.message || "Khong the xac thuc ket qua VNPay");
      }
    };

    run();
  }, [location.search, navigate]);

  if (error) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Thanh toan that bai</h1>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate(PATHS.CUSTOMER_BOOKINGS)}>Ve lich su booking</button>
      </section>
    );
  }

  return <section className="container" style={{ padding: "28px 24px" }}><h1>Dang xac nhan giao dich...</h1></section>;
}
