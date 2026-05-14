package com.commute.ui.activities

import android.Manifest
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.os.Looper
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.commute.R
import com.commute.network.SocketManager
import com.google.android.gms.location.*

class DriverActivity : AppCompatActivity() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var isOnline = false
    private var vehicleId = 1 // Default vehicle ID - change as needed

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_driver)

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        val goOnlineBtn = findViewById<Button>(R.id.goOnlineBtn)
        val statusText = findViewById<TextView>(R.id.statusText)

        SocketManager.onNewBooking { bookingJson ->
            runOnUiThread {
                val pickup = bookingJson.optString("pickup_address", "Unknown")
                Toast.makeText(this, "🚨 New booking! Pickup: $pickup", Toast.LENGTH_LONG).show()
            }
        }

        goOnlineBtn.setOnClickListener {
            if (!isOnline) {
                startLocationUpdates()
                isOnline = true
                goOnlineBtn.text = "Go Offline"
                statusText.text = "🟢 ONLINE — Sending GPS"
            } else {
                stopLocationUpdates()
                SocketManager.goOffline(vehicleId)
                isOnline = false
                goOnlineBtn.text = "Go Online"
                statusText.text = "🔘 OFFLINE"
            }
        }
    }

    private fun startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 1001)
            return
        }
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 3000).build()
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { sendLocation(it) }
            }
        }
        fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
    }

    private fun sendLocation(location: Location) {
        SocketManager.sendLocationUpdate(vehicleId, location.latitude, location.longitude, location.speed * 3.6f, location.bearing)
    }

    private fun stopLocationUpdates() {
        if (::locationCallback.isInitialized) {
            fusedLocationClient.removeLocationUpdates(locationCallback)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        if (isOnline) SocketManager.goOffline(vehicleId)
    }
}