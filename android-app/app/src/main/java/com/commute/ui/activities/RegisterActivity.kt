package com.commute.ui.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.commute.R
import com.commute.data.models.RegisterRequest
import com.commute.network.ApiClient
import com.commute.network.SocketManager
import com.commute.utils.SessionManager
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        val nameInput = findViewById<EditText>(R.id.nameInput)
        val emailInput = findViewById<EditText>(R.id.emailInput)
        val passwordInput = findViewById<EditText>(R.id.passwordInput)
        val phoneInput = findViewById<EditText>(R.id.phoneInput)
        val roleSpinner = findViewById<Spinner>(R.id.roleSpinner)
        val registerBtn = findViewById<Button>(R.id.registerBtn)
        val progressBar = findViewById<ProgressBar>(R.id.progressBar)

        val roles = arrayOf("passenger", "driver")
        roleSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, roles)

        registerBtn.setOnClickListener {
            val name = nameInput.text.toString().trim()
            val email = emailInput.text.toString().trim()
            val password = passwordInput.text.toString().trim()
            val phone = phoneInput.text.toString().trim()
            val role = roleSpinner.selectedItem.toString()

            if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Name, email and password are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            progressBar.visibility = View.VISIBLE
            registerBtn.isEnabled = false

            lifecycleScope.launch {
                try {
                    val response = ApiClient.service.register(RegisterRequest(name, email, password, role, phone))
                    if (response.isSuccessful) {
                        val body = response.body()!!
                        SessionManager.saveSession(body.token, body.user.id, body.user.name, body.user.role, body.user.email)
                        SocketManager.connect()
                        val intent = when (role) {
                            "driver" -> Intent(this@RegisterActivity, DriverActivity::class.java)
                            else -> Intent(this@RegisterActivity, PassengerActivity::class.java)
                        }
                        startActivity(intent)
                        finish()
                    } else {
                        Toast.makeText(this@RegisterActivity, "Registration failed", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(this@RegisterActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                } finally {
                    progressBar.visibility = View.GONE
                    registerBtn.isEnabled = true
                }
            }
        }
    }
}