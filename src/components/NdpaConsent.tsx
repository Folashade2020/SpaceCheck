export default function NdpaConsent() {
  return (
    <label
      style={{
        display: "flex",
        gap: "0.6rem",
        alignItems: "flex-start",
        background: "#FAF9F6",
        border: "1px solid #e7e5e4",
        borderRadius: 10,
        padding: "0.7rem 0.85rem",
        fontSize: "0.82rem",
        color: "#44403c",
        lineHeight: 1.55,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        name="ndpa_consent"
        value="on"
        required
        style={{ marginTop: "0.2rem", width: 16, height: 16, accentColor: "#047857", flexShrink: 0 }}
      />
      <span>
        🔒 SpaceCheck protects your data under the Nigeria Data Protection Act
        (NDPA). Your information is used strictly to facilitate viewing
        requests and property intelligence. We never publicly reveal your exact
        street address or sell your contact details.
      </span>
    </label>
  );
}
