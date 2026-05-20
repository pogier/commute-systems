package com.example.myandroidapp;

import android.Manifest;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;

public class DriverActivity extends AppCompatActivity {

    private TextView statusText, tvGpsStatus;
    private Button goOnlineBtn;
    private LinearLayout bookingsContainer;
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private boolean isOnline = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_driver);

        // Bind views
        statusText = findViewById(R.id.statusText);
        tvGpsStatus = findViewById(R.id.tvGpsStatus);
        goOnlineBtn = findViewById(R.id.goOnlineBtn);
        bookingsContainer = findViewById(R.id.bookingsContainer);

        // Setup location client
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        // Go Online button
        goOnlineBtn.setOnClickListener(v -> {
            if (!isOnline) {
                startLocationUpdates();
                isOnline = true;
                goOnlineBtn.setText("Go Offline");
                statusText.setText("🟢 ONLINE");
            } else {
                stopLocationUpdates();
                isOnline = false;
                goOnlineBtn.setText("Go Online");
                statusText.setText("🔘 OFFLINE");
                tvGpsStatus.setText("Waiting for location...");
            }
        });
    }

    private void startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(this,
                Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 1001);
            return;
        }

        LocationRequest locationRequest = LocationRequest.create()
                .setInterval(5000)
                .setFastestInterval(2000)
                .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) return;
                for (Location location : locationResult.getLocations()) {
                    double lat = location.getLatitude();
                    double lng = location.getLongitude();
                    tvGpsStatus.setText("📍 " + lat + ", " + lng);
                }
            }
        };

        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, null);
    }

    private void stopLocationUpdates() {
        if (locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
        }
    }

    // Add a booking card to the list
    public void addBookingCard(String passengerName, String pickup, String dropoff, String status) {
        LayoutInflater inflater = LayoutInflater.from(this);
        View card = inflater.inflate(R.layout.item_booking, bookingsContainer, false);

        TextView tvName = card.findViewById(R.id.tvPassengerName);
        TextView tvPickup = card.findViewById(R.id.tvPickupLocation);
        TextView tvDropoff = card.findViewById(R.id.tvDropoffLocation);
        TextView tvStatus = card.findViewById(R.id.tvStatus);

        tvName.setText(passengerName);
        tvPickup.setText("Pickup: " + pickup);
        tvDropoff.setText("Dropoff: " + dropoff);
        tvStatus.setText(status);

        bookingsContainer.addView(card);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopLocationUpdates();
    }
}
