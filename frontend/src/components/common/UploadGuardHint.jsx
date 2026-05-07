export default function UploadGuardHint({ text = "Ho tro JPG, PNG, WEBP toi da 2MB" }) {
  return (
    <small style={{ color: "#64748b", display: "block", marginTop: 4 }}>
      {text}
    </small>
  );
}
