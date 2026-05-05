import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<number, any>>({});
  const mapInitRef = useRef(false);

  useEffect(() => {
    fetchVehicles();
    const socket = getSocket();
    socket.on('fleet:location_update', (data: any) => {
      updateMarker(data.vehicle_id, data.lat, data.lng, data.speed);
    });
    const timer = setTimeout(initMap, 500);
    return () => { socket.off('fleet:location_update'); clearTimeout(timer); };
  }, []);

  const initMap = () => {
    const L = (window as any).L;
    if (L && !mapInitRef.current) {
      mapInitRef.current = true;
      const map = L.map('fleet-map').setView([14.5995, 120.9842], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
      mapRef.current = map;
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/fleet/vehicles');
      setVehicles(res.data);
    } catch {}
  };

  const updateMarker = (vehicleId: number, lat: number, lng: number, speed?: number) => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;
    const pos = [lat, lng];
    if (markersRef.current[vehicleId]) {
      markersRef.current[vehicleId].setLatLng(pos);
    } else {
      const icon = L.divIcon({ className: '', html: `<div style="background:#4f8ef7;color:#fff;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.4)">🚌 ${vehicleId}</div>`, iconAnchor: [20, 12] });
      markersRef.current[vehicleId] = L.marker(pos, { icon }).addTo(mapRef.current).bindPopup(`Vehicle ${vehicleId} — ${speed || 0} km/h`);
    }
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, live_lat: lat, live_lng: lng, live_speed: speed } : v));
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🚌 Live Fleet</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 'calc(100vh - 160px)' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowY: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>Vehicles ({vehicles.length})</div>
          {vehicles.map((v: any) => (
            <div key={v.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              onClick={() => { if (v.current_lat && mapRef.current) mapRef.current.setView([v.current_lat, v.current_lng], 15); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{v.plate_number}</span>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: v.status === 'active' ? 'var(--accent2)' : 'var(--text2)' }}>{v.status}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{v.type} · {v.capacity} seats</div>
              {v.driver_name && <div style={{ fontSize: 12, color: 'var(--text2)' }}>👤 {v.driver_name}</div>}
              {v.live_lat && <div style={{ fontSize: 11, color: 'var(--accent2)', marginTop: 4 }}>📍 Live · {v.live_speed || 0} km/h</div>}
            </div>
          ))}
          {vehicles.length === 0 && <div style={{ padding: 20, color: 'var(--text2)', fontSize: 14 }}>No vehicles yet.</div>}
        </div>
        <div style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div id="fleet-map" style={{ width: '100%', height: '100%', background: '#1a1d27' }} />
        </div>
      </div>
    </div>
  );
}