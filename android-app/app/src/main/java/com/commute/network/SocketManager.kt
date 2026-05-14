package com.commute.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

object SocketManager {
    private const val SERVER_URL = "http://192.168.1.3:4000"
    private var socket: Socket? = null

    fun connect() {
        try {
            val options = IO.Options().apply {
                transports = arrayOf("websocket")
                reconnection = true
            }
            socket = IO.socket(SERVER_URL, options)
            socket?.connect()
            Log.d("SocketManager", "Connecting...")
        } catch (e: Exception) {
            Log.e("SocketManager", "Error: ${e.message}")
        }
    }

    fun disconnect() { socket?.disconnect(); socket = null }
    fun isConnected() = socket?.connected() == true

    fun sendLocationUpdate(vehicleId: Int, lat: Double, lng: Double, speed: Float, heading: Float) {
        val data = JSONObject().apply {
            put("vehicle_id", vehicleId)
            put("lat", lat)
            put("lng", lng)
            put("speed", speed)
            put("heading", heading)
        }
        socket?.emit("driver:location_update", data)
    }

    fun goOffline(vehicleId: Int) {
        socket?.emit("driver:offline", JSONObject().apply { put("vehicle_id", vehicleId) })
    }

    fun onNewBooking(callback: (JSONObject) -> Unit) {
        socket?.on("new_booking") { args ->
            if (args.isNotEmpty()) callback(args[0] as JSONObject)
        }
    }

    fun onBookingStatusChanged(callback: (Int, String) -> Unit) {
        socket?.on("booking_status_changed") { args ->
            if (args.isNotEmpty()) {
                val obj = args[0] as JSONObject
                callback(obj.getInt("booking_id"), obj.getString("status"))
            }
        }
    }

    fun removeAllListeners() { socket?.off() }
}