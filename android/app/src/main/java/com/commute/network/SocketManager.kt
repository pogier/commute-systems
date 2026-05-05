package com.commute.network

import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

object SocketManager {
    private val socket: Socket = IO.socket("http://10.0.2.2:4000") // 10.0.2.2 = localhost from emulator

    fun connect() = socket.connect()

    // Driver sends GPS location update (broadcasts to web dashboard instantly)
    fun sendLocation(vehicleId: String, lat: Double, lng: Double) {
        val data = JSONObject().apply {
            put("vehicleId", vehicleId)
            put("lat", lat)
            put("lng", lng)
        }
        socket.emit("driver:location", data)
    }

    // Listen for booking confirmations
    fun onBookingCreated(callback: (JSONObject) -> Unit) {
        socket.on("booking:created") { args ->
            callback(args[0] as JSONObject)
        }
    }
}