import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { authService } from "../authService";
import { useAuth } from "../useAuth";
import { PATHS } from "../../../routes/pathConstants";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    const verify = async () => {
      // Validate params
      if (!email || !token) {
        setStatus("error");
        setMessage("Invalid verification link. Missing email or token.");
        return;
      }

      try {
        // Call backend to verify email
        const result = await authService.verifyEmail({ email, token });
        if (result) {
          setStatus("success");
          setMessage("Email verified successfully! Redirecting to login...");
          logout();
          // Redirect to login after 2 seconds
          setTimeout(() => {
            navigate(PATHS.LOGIN, { replace: true });
          }, 2000);
        } else {
          setStatus("error");
          setMessage("Email verification failed. The link may have expired or is invalid.");
        }
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "An error occurred during verification. Please try again.");
      }
    };

    verify();
  }, [email, token, navigate]);

  return (
    <section className="container auth-shell page-shell">
      <div className="auth-visual card">
        <div className="auth-visual-content">
          <span className="hero-badge">Email Verification</span>
          <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 58px)", lineHeight: 0.98 }}>
            Xác minh email của bạn
          </h1>
          <p style={{ maxWidth: 520, margin: 0, color: "rgba(255,255,255,0.8)" }}>
            Chúng tôi đang xác minh địa chỉ email của bạn để hoàn tất quá trình đăng ký.
          </p>
        </div>
      </div>

      <div className="auth-card">
        <div className="card card-elevated" style={{ display: "grid", gap: 20, textAlign: "center", padding: "40px 28px" }}>
          {status === "loading" && (
            <>
              <div style={{ fontSize: 48, animation: "spin 1s linear infinite" }}>⏳</div>
              <div>
                <h2 style={{ margin: "0 0 8px", fontSize: 24, color: "#0d2238" }}>Đang xác minh email...</h2>
                <p style={{ color: "#64748b", margin: 0 }}>Vui lòng chờ trong giây lát.</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div style={{ fontSize: 64 }}>✓</div>
              <div>
                <h2 style={{ margin: "0 0 8px", fontSize: 24, color: "#16a34a" }}>Email đã được xác minh!</h2>
                <p style={{ color: "#64748b", margin: "0 0 16px" }}>
                  Tài khoản của bạn đã được xác minh thành công. Bạn sẽ được chuyển hướng tới trang đăng nhập...
                </p>
                <Link to={PATHS.LOGIN} style={{ display: "inline-block", padding: "12px 28px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "#fff", fontWeight: 700, textDecoration: "none" }}>
                  Đến trang đăng nhập →
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div style={{ fontSize: 64 }}>✕</div>
              <div>
                <h2 style={{ margin: "0 0 8px", fontSize: 24, color: "#b91c1c" }}>Xác minh thất bại</h2>
                <p style={{ color: "#64748b", margin: "0 0 16px" }}>
                  {message || "Đã xảy ra lỗi khi xác minh email. Vui lòng thử lại hoặc liên hệ với hỗ trợ."}
                </p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link to={PATHS.HOME} style={{ display: "inline-block", padding: "12px 24px", borderRadius: 99, border: "1px solid #e2e8f0", background: "white", color: "#0d2238", fontWeight: 700, textDecoration: "none" }}>
                    Về trang chủ
                  </Link>
                  <Link to={PATHS.REGISTER} style={{ display: "inline-block", padding: "12px 28px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "#fff", fontWeight: 700, textDecoration: "none" }}>
                    Đăng ký lại →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
