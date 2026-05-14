package com.commute.network

import com.commute.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Response<AuthResponse>

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<AuthResponse>

    @GET("fleet/vehicles")
    suspend fun getVehicles(): Response<List<Vehicle>>

    @GET("fleet/routes")
    suspend fun getRoutes(): Response<List<Route>>

    @GET("bookings")
    suspend fun getBookings(): Response<List<Booking>>

    @POST("bookings")
    suspend fun createBooking(@Body body: CreateBookingRequest): Response<Booking>

    @PATCH("bookings/{id}/status")
    suspend fun updateBookingStatus(@Path("id") id: Int, @Body body: StatusUpdateRequest): Response<Booking>
}