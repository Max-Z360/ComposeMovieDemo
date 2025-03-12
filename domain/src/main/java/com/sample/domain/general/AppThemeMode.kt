package com.sample.domain.general

import androidx.annotation.StringRes
import java.io.Serializable

data class AppThemeMode(
    @StringRes val title: Int,
    val themeCode: String
) : Serializable {
    companion object {
        const val LIGHT_MODE = "light_mode"
        const val DARK_MODE = "dark_mode"
        const val SYSTEM_DEFAULT = "system_default"
    }
}
