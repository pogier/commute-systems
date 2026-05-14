package com.commute.ui.activities

import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.commute.R
import com.commute.data.models.CreateBookingRequest
import com.commute.data.models.Route
import com.commute.network.ApiClient
import com.commute.network.SocketManager
import com.commute.utils.SessionManager
import kotlinx.coroutines.launch

class PassengerActivity : AppCompatActivity() {
    private var routes: List<Route> = emptyList()
    private var selectedRouteId: Int = -1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_passenger)

        val routeSpinner = findViewById<Spinner>(R.id.routeSpinner)
        val pickupInput = findViewById<EditText>(R.id.pickupInput)
        val dropoffInput = findViewById<EditText>(R.id.dropoffInput)
        val bookBtn = findViewById<Button>(R.id.bookBtn)
        val myBookingsBtn = findViewById<Button>(R.id.myBookingsBtn)
        val statusText = findViewById<TextView>(R.id.bookingStatus)
        val signOutBtn = findViewById<Button>(R.id.signOutBtn)

        // Load routes
        lifecycleScope.launch {
            try {
                val response = ApiClient.service.getRoutes()
                if (response.isSuccessful) {
                    routes = response.body() ?: emptyList()
                    val adapter = ArrayAdapter(this@PassengerActivity,
                        android.R.layout.simple_spinner_item,
                        routes.map { "${it.name} — ₱${it.fare}" })
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                    routeSpinner.adapter = adapter
                    routeSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                        override fun onItemSelected(p: AdapterView<*>?, v: android.view.View?, pos: Int, id: Long) {
                            selectedRouteId = routes[pos].id
                        }
                        override fun onNothingSelected(p: AdapterView<*>?) {}
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(this@PassengerActivity, "Failed to load routes", Toast.LENGTH_SHORT).show()
            }
        }

        // Listen for booking updates
        SocketManager.onBookingStatusChanged { bookingId, status ->
            runOnUiThread {
                statusText.text = "Booking #$bookingId is now: ${status.uppercase()}"
            }
        }

        bookBtn.setOnClickListener {
            val pickup = pickupInput.text.toString().trim()
            val dropoff = dropoffInput.text.toString().trim()
            if (pickup.isEmpty() || dropoff.isEmpty() || selectedRouteId == -1) {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            bookBtn.isEnabled = false
            statusText.text = "Creating booking..."
            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.createBooking(
                        CreateBookingRequest(selectedRouteId, pickup, dropoff)
                    )
                    if (response.isSuccessful) {
                        val booking = response.body()!!
                        statusText.text = "✅ Booking #${booking.id} created! Status: ${booking.status}"
                        pickupInput.text.clear()
                        dropoffInput.text.clear()
                    } else {
                        statusText.text = "❌ Booking failed. Try again."
                    }
                } catch (e: Exception) {
                    statusText.text = "❌ Error: ${e.message}"
                } finally {
                    bookBtn.isEnabled = true
                }
            }
        }

        myBookingsBtn.setOnClickListener {
            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.getBookings()
                    if (response.isSuccessful) {
                        val bookings = response.body() ?: emptyList()
                        if (bookings.isEmpty()) {
                            statusText.text = "No bookings yet"
                        } else {
                            val latest = bookings.first()
                            statusText.text = "Latest: #${latest.id} — ${latest.route_name} — ${latest.status.uppercase()}"
                        }
                    }
                } catch (e: Exception) {
                    statusText.text = "Could not fetch bookings"
                }
            }
        }

        signOutBtn.setOnClickListener {
            SessionManager.clearSession()
            SocketManager.disconnect()
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        SocketManager.removeAllListeners()
    }
}