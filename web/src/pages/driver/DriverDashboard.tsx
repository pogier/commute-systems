import { useEffect, useState } from "react";
import api from "../../services/api";
import { getSocket } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";

const STATUS_META: Record<string, {
  label: string; color: string; next: string | null; btnText: string | null
}> = {
  pending:   { label: "Pending",   color: "#f59e0b", next: "confirmed", btnText: "Accept"   },
  confirmed: { label: "Confirmed", color: "#4a8ff5", next: "onboard",   btnText: "Pick up"  },
  onboard:   { label: "Onboard",   color: "#10b981", next: "completed", btnText: "Drop off" },
  completed: { label: "Completed", color: "#34d399", next: null,        btnText: null       },
  cancelled: { label: "Cancelled", color: "#f06b6b", next: null,        btnText: null       },
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [toast, setToast]       = useState("");

  useEffect(() => {
    fetchBookings();
    const socket = getSocket();
    socket.on("new_booking", (booking: any) => {
      showToast(`New booking from ${booking.pickup_address}!`);
      fetchBookings();
    });
    return () => { socket.off("new_booking"); };
  }, []);

  const fetchBookings = async () => {
    try { const res = await api.get("/bookings"); setBookings(res.data); } catch {}
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // One function handles Accept, Pick up, and Drop off
  const updateStatus = async (bookingId: number, status: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        status,
        vehicle_id: (user as any)?.vehicleId ?? null
      });
      fetchBookings();
    } catch (err: any) {
      showToast("Failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background:"#10b981", color:"#fff", padding:"10px 20px",
          borderRadius:10, fontWeight:700, zIndex:999 }}>
          {toast}
        </div>
      )}

      <button onClick={() => setIsOnline(o => !o)} style={{
        background: isOnline ? "#ef4444" : "#0ea5e9", color:"#fff",
        padding:"12px 28px", borderRadius:10, fontWeight:700,
        border:"none", cursor:"pointer", marginBottom:24 }}>
        {isOnline ? "Go Offline" : "Go Online"}
      </button>

      <div style={{ fontWeight:700, fontSize:16, marginBottom:12 }}>
        Incoming Bookings ({bookings.length})
      </div>

      {bookings.length === 0 && (
        <p style={{ color:"#888" }}>No bookings yet. Passenger must create one first.</p>
      )}

      {bookings.map((b: any) => {
        const meta = STATUS_META[b.status] || STATUS_META.pending;
        return (
          <div key={b.id} style={{ border:"1px solid #1c2842",
            borderRadius:10, padding:16, marginBottom:12, background:"#0c1018" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontWeight:700 }}>{b.route_name}</span>
              <span style={{ color:meta.color, fontWeight:700, fontSize:12,
                padding:"2px 8px", borderRadius:20,
                border:`1px solid ${meta.color}60`,
                background:`${meta.color}18` }}>
                {meta.label}
              </span>
            </div>
            <div style={{ fontSize:12, color:"#526a96" }}>Pickup:  {b.pickup_address}</div>
            <div style={{ fontSize:12, color:"#526a96", marginBottom:10 }}>
              Drop-off: {b.dropoff_address}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontWeight:700, color:"#38bdf8", fontSize:15 }}>
                P{b.fare}
              </span>
              {meta.btnText && meta.next && (
                <button onClick={() => updateStatus(b.id, meta.next!)} style={{
                  padding:"5px 14px", borderRadius:7, fontWeight:700,
                  fontSize:12, border:"none", cursor:"pointer",
                  background: meta.next === "confirmed" ? "#10b98120" :
                              meta.next === "onboard"   ? "#0ea5e920" : "#8b5cf620",
                  color:      meta.next === "confirmed" ? "#34d399"   :
                              meta.next === "onboard"   ? "#38bdf8"   : "#c4b5fd" }}>
                  {meta.btnText}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
