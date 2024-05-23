export default function FullScreenLoader() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)", // Translucent background
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1050, // High z-index to cover everything
        pointerEvents: "auto", // Ensures clicks don't go through
      }}
    >
      <div
        style={{
          width: "100px",
          height: "100px",
          background: `url('/eco-loader.png') no-repeat center center`,
          backgroundSize: "contain",
          animation: "spin 2s linear infinite",
        }}
      ></div>
    </div>
  );
}
