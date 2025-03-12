package com.sample.mz

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber

@HiltAndroidApp
class MovieApp : Application() {
    override fun onCreate() {
        super.onCreate()
        setupTimber()
    }
}

private fun setupTimber() {
    if (!BuildConfig.DEBUG) return
    Timber.plant(object : Timber.DebugTree() {
        override fun createStackElementTag(element: StackTraceElement): String {
            val prefix = super.createStackElementTag(element)?.substringBefore("$") ?: "Timber"
            return String.format("C:%s, L:%s", prefix, element.lineNumber, element.methodName)
        }
    })
}