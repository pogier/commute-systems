package com.commute.ui.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.commute.R
import com.commute.data.models.LoginRequest
import com.commute.network.ApiClient
import com.commute.network.SocketManager
import com.commute.utils.SessionManager
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (SessionManager.isLoggedIn()) {
            navigateToMain()
            return
        }

        setContentView(R.layout.activity_login)

        val emailInput = findViewById<EditText>(R.id.emailInput)
        val passwordInput = findViewById<EditText>(R.id.passwordInput)
        val loginButton = findViewById<Button>(R.id.loginButton)
        val registerLink = findViewById<TextView>(R.id.registerLink)
        val progressBar = findViewById<ProgressBar>(R.id.progressBar)

        loginButton.setOnClickListener {
            val email = emailInput.text.toString().trim()
            val password = passwordInput.text.toString().trim()
            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            progressBar.visibility = View.VISIBLE
            loginButton.isEnabled = false
            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.login(LoginRequest(email, password))
                    if (response.isSuccessful) {
                        val body = response.body()!!
                        SessionManager.saveSession(body.token, body.user.id, body.user.name, body.user.role, body.user.email)
                        SocketManager.connect()
                        navigateToMain()
                    } else {
                        Toast.makeText(this@LoginActivity, "Invalid email or password", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(this@LoginActivity, "Connection error: ${e.message}", Toast.LENGTH_LONG).show()
                } finally {
                    progressBar.visibility = View.GONE
                    loginButton.isEnabled = true
                }
            }
        }

        registerLink.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun navigateToMain() {
        val intent = when (SessionManager.getUserRole()) {
            "driver" -> Intent(this, DriverActivity::class.java)
            else -> Intent(this, PassengerActivity::class.java)
        }
        startActivity(intent)
        finish()
    }
}