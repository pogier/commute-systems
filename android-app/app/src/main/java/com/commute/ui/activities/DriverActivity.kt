package com.commute.ui.activities

import android.Manifest
import android.content.res.ColorStateList
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Bundle
import android.os.Looper
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.lifecycle.lifecycleScope
import com.commute.R
import com.commute.data.models.Booking
import com.commute.data.models.StatusUpdateRequest
import com.commute.network.ApiClient
import com.commute.network.SocketManager
import com.google.android.gms.location.*
import kotlinx.coroutines.launch

class DriverActivity : AppCompatActivity() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var isOnline = false
    private var vehicleId = 1  // TODO: get from SessionManager.getVehicleId()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_driver)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        fetchBookings()  // load list immediately on screen open

        SocketManager.onNewBooking { bookingJson ->
            runOnUiThread {
                val pickup = bookingJson.optString("pickup_address", "Unknown")
                Toast.makeText(this, "New booking! Pickup: $pickup", Toast.LENGTH_LONG).show()
                fetchBookings()  // refresh list
            }
        }

        val goOnlineBtn = findViewById<Button>(R.id.goOnlineBtn)
        val statusText  = findViewById<TextView>(R.id.statusText)
        goOnlineBtn.setOnClickListener {
            if (!isOnline) {
                startLocationUpdates(); isOnline = true
                goOnlineBtn.text = "Go Offline"
                goOnlineBtn.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#EF4444"))
                statusText.text = "ONLINE"; statusText.setTextColor(Color.parseColor("#10B981"))
            } else {
                stopLocationUpdates(); SocketManager.goOffline(vehicleId); isOnline = false
                goOnlineBtn.text = "Go Online"
                goOnlineBtn.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#0EA5E9"))
                statusText.text = "OFFLINE"; statusText.setTextColor(Color.parseColor("#6B7FA8"))
            }
        }
    }

    private fun fetchBookings() {
        lifecycleScope.launch {
            try {
                val response = ApiClient.service.getBookings()
                if (response.isSuccessful)
                    runOnUiThread { updateBookingsList(response.body() ?: emptyList()) }
            } catch (e: Exception) { /* silent */ }
        }
    }

    private fun updateBookingsList(bookings: List<Booking>) {
        val container = findViewById<LinearLayout>(R.id.bookingsContainer)
        container.removeAllViews()
        if (bookings.isEmpty()) {
            val tv = TextView(this)
            tv.text = "No bookings yet"
            tv.setTextColor(Color.parseColor("#6B7FA8"))
            container.addView(tv); return
        }
        bookings.take(10).forEach { booking ->
            val item = layoutInflater.inflate(R.layout.item_booking, container, false)
            item.findViewById<TextView>(R.id.bRoute).text   = booking.route_name ?: "Route"
            item.findViewById<TextView>(R.id.bPickup).text  = "Pickup: ${booking.pickup_address}"
            item.findViewById<TextView>(R.id.bDropoff).text = "Drop-off: ${booking.dropoff_address}"
            item.findViewById<TextView>(R.id.bStatus).text  = booking.status.uppercase()
            item.findViewById<TextView>(R.id.bFare).text    = "P${booking.fare}"
            val btn = item.findViewById<Button>(R.id.bAcceptBtn)
            when (booking.status) {
                "pending" -> {
                    btn.visibility = View.VISIBLE; btn.text = "Accept"
                    btn.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#10B981"))
                    btn.setOnClickListener { updateStatus(booking.id, "confirmed", btn) }
                }
                "confirmed" -> {
                    btn.visibility = View.VISIBLE; btn.text = "Pick up"
                    btn.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#0EA5E9"))
                    btn.setOnClickListener { updateStatus(booking.id, "onboard", btn) }
                }
                "onboard" -> {
                    btn.visibility = View.VISIBLE; btn.text = "Drop off"
                    btn.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#8B5CF6"))
                    btn.setOnClickListener { updateStatus(booking.id, "completed", btn) }
                }
                else -> btn.visibility = View.GONE
            }
            container.addView(item)
        }
    }

    private fun updateStatus(bookingId: Int, status: String, btn: Button) {
        btn.isEnabled = false; btn.text = "..."
        lifecycleScope.launch {
            try {
                val vId = if (status == "confirmed") vehicleId else null
                val res = ApiClient.service.updateBookingStatus(
                    bookingId, StatusUpdateRequest(status, vId))
                if (res.isSuccessful) runOnUiThread {
                    Toast.makeText(this@DriverActivity,
                        "Booking #$bookingId -> $status", Toast.LENGTH_SHORT).show()
                    fetchBookings()
                }
            } catch (e: Exception) {
                runOnUiThread { btn.isEnabled = true; fetchBookings() }
            }
        }
    }

    private fun startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(this,
                Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 1001); return
        }
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 3000).build()
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(r: LocationResult) {
                r.lastLocation?.let {
                    SocketManager.sendLocationUpdate(vehicleId,
                        it.latitude, it.longitude, it.speed * 3.6f, it.bearing)
                    runOnUiThread {
                        findViewById<TextView>(R.id.speedValue)?.text =
                            (it.speed * 3.6).toInt().toString()
                    }
                }
            }
        }
        fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
    }

    private fun stopLocationUpdates() {
        if (::locationCallback.isInitialized)
            fusedLocationClient.removeLocationUpdates(locationCallback)
    }

    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        if (isOnline) SocketManager.goOffline(vehicleId)
    }
}
