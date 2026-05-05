package com.commute.network

import retrofit2.http.*

data class BookingRequest(val routeId: String, val pickupTime: String)
data class Vehicle(val id: String, val lat: Double, val lng: Double, val status: String)

interface ApiService {
    @POST("bookings")
    suspend fun createBooking(@Body request: BookingRequest): Any

    @GET("fleet/vehicles")
    suspend fun getVehicles(): List<Vehicle>
}