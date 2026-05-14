package com.commute.data.models

data class LoginRequest(val email: String, val password: String)
data class RegisterRequest(val name: String, val email: String, val password: String, val role: String, val phone: String)

data class User(val id: String, val name: String, val email: String, val role: String, val phone: String?)
data class AuthResponse(val token: String, val user: User)

data class Route(val id: Int, val name: String, val origin: String, val destination: String, val fare: Double)
data class Vehicle(val id: Int, val plate_number: String, val type: String, val capacity: Int, val status: String, val driver_name: String?, val live_lat: Double?, val live_lng: Double?, val live_speed: Double?)
data class Booking(val id: Int, val passenger_id: Int, val vehicle_id: Int?, val route_id: Int, val route_name: String?, val pickup_address: String, val dropoff_address: String, val status: String, val fare: Double, val created_at: String)
data class CreateBookingRequest(val route_id: Int, val pickup_address: String, val dropoff_address: String)
data class StatusUpdateRequest(val status: String)