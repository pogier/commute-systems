package com.commute

import android.app.Application
import com.commute.utils.SessionManager

class MainActivity : Application() {
    override fun onCreate() {
        super.onCreate()
        SessionManager.init(this)
    }
}