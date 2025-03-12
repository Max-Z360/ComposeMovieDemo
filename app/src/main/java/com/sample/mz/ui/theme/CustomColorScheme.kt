package com.sample.mz.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color

@Immutable
data class CustomColorsScheme(
    val searchBoxColor: Color = Color.Unspecified,
) {
    companion object {
        val OnLight = CustomColorsScheme(
            searchBoxColor = Color(color = 0xFFEEEEEE),
        )

        val OnDark = CustomColorsScheme(
            searchBoxColor = Color.DarkGray,
        )
    }
}

