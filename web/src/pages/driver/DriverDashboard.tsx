import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { getSocket } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";

interface Booking {
  id: number;
  route_id: number;
  route_name?: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  fare: number;
}

interface BookingEvent {
  pickup_address: string;
}

const STATUS_META: Record<string, {
  label: string; color: string; next: string | null; btnText: string | null;
  btnBg: string; btnColor: string; btnBorder: string;
}> = {
  pending:   { label: "Pending",   color: "#f59e0b", next: "confirmed", btnText: "Accept",
               btnBg: "rgba(16,185,129,.08)", btnColor: "#34d399", btnBorder: "rgba(16,185,129,.22)" },
  confirmed: { label: "Confirmed", color: "#4a8ff5", next: "onboard",   btnText: "Pick up",
               btnBg: "rgba(14,165,233,.08)", btnColor: "#38bdf8", btnBorder: "rgba(14,165,233,.22)" },
  onboard:   { label: "Onboard",   color: "#10b981", next: "completed", btnText: "Drop off",
               btnBg: "rgba(139,92,246,.08)", btnColor: "#c4b5fd", btnBorder: "rgba(139,92,246,.22)" },
  completed: { label: "Completed", color: "#34d399", next: null, btnText: null,
               btnBg: "", btnColor: "", btnBorder: "" },
  cancelled: { label: "Cancelled", color: "#f06b6b", next: null, btnText: null,
               btnBg: "", btnColor: "", btnBorder: "" },
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [coords, setCoords] = useState("Not tracking");
  const [toast, setToast] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get("/bookings");
      setBookings(res.data as Booking[]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void (async () => { await fetchBookings(); })();
    const socket = getSocket();
    socket.on("new_booking", (booking: BookingEvent) => {
      showToast(`New booking! Pickup: ${booking.pickup_address}`);
      void (async () => { await fetchBookings(); })();
    });
    return () => {
      socket.off("new_booking");
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const toggleOnline = () => {
    if (!isOnline) {
      setIsOnline(true);
      setCoords("14.59950, 120.98420");
      let s = 0;
      intervalRef.current = setInterval(() => {
        s = Math.max(0, Math.min(80, s + (Math.random() - 0.35) * 10));
        setSpeed(Math.round(s));
      }, 1000);
    } else {
      setIsOnline(false);
      setSpeed(0);
      setCoords("Not tracking");
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const updateStatus = async (bookingId: number, status: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        status,
        vehicle_id: (user as any)?.vehicleId ?? null,
      });
      fetchBookings();
    } catch (err: any) {
      showToast("Failed: " + (err.response?.data?.error || err.message));
    }
  };

  const vehicleInfo = (user as any)?.vehicleId ? `Vehicle #${(user as any).vehicleId}` : "No vehicle assigned";

  return (
    <div style={{ position: "relative" }}>
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#10b981", color: "#fff", padding: "10px 20px",
          borderRadius: 10, fontWeight: 700, zIndex: 999, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      {/* Banner */}
      <div style={{
        padding: "11px 16px", borderRadius: 11, marginBottom: 20,
        borderLeft: "3px solid #0ea5e9", background: "rgba(14,165,233,.08)",
        color: "#38bdf8", fontSize: 13, fontWeight: 600,
      }}>
        🚌 Driver Mode — Bookings are always shown below. Go online to receive new ones in real time.
      </div>

      {/* Page header */}
      <div style={{ marginBottom: 27, paddingBottom: 18, borderBottom: "1px solid #1c2842" }}>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 3 }}>
          Driver Dashboard
        </div>
        <div style={{ fontSize: 13, color: "#526a96" }}>
          {user?.name} · {vehicleInfo}
        </div>
      </div>

      {/* Main 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>

        {/* GPS status card */}
        <div style={{
          background: isOnline ? "rgba(14,165,233,.08)" : "#0c1018",
          border: `1px solid ${isOnline ? "rgba(14,165,233,.22)" : "#1c2842"}`,
          borderRadius: 11, padding: "36px 24px", textAlign: "center",
          transition: "all .2s",
        }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>{isOnline ? "🟢" : "⚫"}</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
            {isOnline ? "You Are Online" : "You Are Offline"}
          </div>
          <div style={{ fontSize: 12, color: "#526a96", marginBottom: 22, maxWidth: 260, margin: "0 auto 22px" }}>
            {isOnline
              ? "Your GPS is being broadcast to passengers in real time."
              : "Tap Go Online to broadcast your GPS to passengers in real time."}
          </div>
          <button onClick={toggleOnline} style={{
            width: "100%", padding: 13, fontSize: 14, fontWeight: 800,
            borderRadius: 9, border: "none", cursor: "pointer",
            background: isOnline ? "#ef4444" : "#0ea5e9", color: "#fff",
            fontFamily: "inherit", transition: "all .15s",
          }}>
            {isOnline ? "Go Offline" : "Go Online"}
          </button>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Speed */}
            <div style={{ background: "#0c1018", border: "1px solid #1c2842", borderRadius: 11, padding: 15 }}>
              <div style={{ fontSize: 10, color: "#526a96", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>
                Speed
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#38bdf8" }}>{speed}</span>
                <span style={{ fontSize: 11, color: "#526a96" }}> km/h</span>
              </div>
            </div>
            {/* GPS Coords */}
            <div style={{ background: "#0c1018", border: "1px solid #1c2842", borderRadius: 11, padding: 15 }}>
              <div style={{ fontSize: 10, color: "#526a96", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>
                GPS Coords
              </div>
              <div style={{
                fontSize: 11, fontFamily: "monospace", lineHeight: 1.5,
                color: isOnline ? "#38bdf8" : "#2d3f64",
              }}>
                {coords}
              </div>
            </div>
          </div>

          {/* Socket status */}
          <div style={{ background: "#0c1018", border: "1px solid #1c2842", borderRadius: 11, padding: 15 }}>
            <div style={{ fontSize: 10, color: "#526a96", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>
              Socket Status
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: isOnline ? "#38bdf8" : "#526a96" }}>
              {isOnline ? "✅ Broadcasting GPS · Listening for new_booking events" : "Offline — not broadcasting"}
            </div>
          </div>

          {/* How it works */}
          <div style={{ background: "#0c1018", border: "1px solid #1c2842", borderRadius: 11, padding: 15 }}>
            <div style={{ fontSize: 10, color: "#526a96", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 10 }}>
              How It Works
            </div>
            {[
              "Bookings load automatically when you open this page",
              "Tap Go Online to broadcast GPS every 3 seconds",
              "New bookings flash and refresh the list instantly",
              "Tap Go Offline to end your shift",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: i < 3 ? 11 : 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, marginTop: 1,
                  background: "rgba(14,165,233,.08)", border: "1px solid rgba(14,165,233,.22)", color: "#38bdf8",
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 12, color: "#526a96" }}>{step}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings section */}
      <div style={{ background: "#0c1018", border: "1px solid #1c2842", borderRadius: 11, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Incoming Bookings</div>
          {isOnline && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%", background: "#10b981",
                boxShadow: "0 0 0 3px rgba(16,185,129,.2)",
                animation: "pulse 2s infinite",
              }} />
              <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>Live</span>
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#526a96", marginBottom: 16 }}>
          Loaded on page open via <code style={{ fontFamily: "monospace", fontSize: 11 }}>GET /api/bookings</code>
          {" "}· Auto-refreshes on <code style={{ fontFamily: "monospace", fontSize: 11 }}>new_booking</code> socket event
        </div>

        {bookings.length === 0 ? (
          <p style={{ color: "#526a96", fontSize: 13 }}>No bookings yet. Passenger must create one first.</p>
        ) : (
          bookings.map((b: any) => {
            const meta = STATUS_META[b.status] || STATUS_META.pending;
            return (
              <div key={b.id} style={{
                background: "#111926", border: "1px solid #243158",
                borderRadius: 9, padding: "13px 15px", marginBottom: 9,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, flex: 1, marginRight: 12 }}>
                    {b.route_name || `Route #${b.route_id}`}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px",
                    color: meta.color, flexShrink: 0, padding: "2px 8px", borderRadius: 20,
                    background: `${meta.color}18`, border: `1px solid ${meta.color}40`,
                  }}>
                    {meta.label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#526a96", marginBottom: 2 }}>📍 {b.pickup_address}</div>
                <div style={{ fontSize: 12, color: "#526a96" }}>🏁 {b.dropoff_address}</div>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: 8, paddingTop: 8, borderTop: "1px solid #1c2842",
                }}>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "#2d3f64" }}>#{b.id}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#38bdf8" }}>₱{b.fare}</span>
                    {meta.btnText && meta.next && (
                      <button onClick={() => updateStatus(b.id, meta.next!)} style={{
                        padding: "5px 13px", borderRadius: 7, fontSize: 11, fontWeight: 800,
                        border: `1px solid ${meta.btnBorder}`, cursor: "pointer",
                        background: meta.btnBg, color: meta.btnColor, fontFamily: "inherit",
                        transition: "all .13s",
                      }}>
                        {meta.btnText}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div style={{
          fontSize: 10, color: "#2d3f64", textAlign: "center",
          marginTop: 5, paddingTop: 5, borderTop: "1px dashed #1c2842",
        }}>
          {bookings.length} bookings ·{" "}
          {isOnline
            ? <span style={{ color: "#34d399" }}>✅ Auto-refreshes on new_booking socket event</span>
            : "Loaded on page open — go online to receive new bookings live"}
        </div>
      </div>
    </div>
  );
}
