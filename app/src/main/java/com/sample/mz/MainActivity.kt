package com.sample.mz

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.windowsizeclass.ExperimentalMaterial3WindowSizeClassApi
import androidx.compose.material3.windowsizeclass.calculateWindowSizeClass
import androidx.compose.runtime.Composable
import com.sample.mz.navigation.MainPage
import com.sample.mz.ui.theme.ComposeMovieAppCleanArchitectureTheme
import com.sample.domain.general.AppThemeMode
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val viewModel by viewModels<MainViewModel>()

    @OptIn(ExperimentalMaterial3WindowSizeClassApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            ComposeMovieAppCleanArchitectureTheme(
                localeCode = viewModel.currentLanguage.value,
                darkTheme = isDarkMode(themeCode = viewModel.appThemeMode.value)
            ) { localeCode ->
                MainPage(
                    localeCode = localeCode,
                    windowSizeClass = calculateWindowSizeClass(this),
                )
            }
        }
    }
}

@Composable
fun isDarkMode(themeCode: String) = when (themeCode) {
    AppThemeMode.LIGHT_MODE -> false
    AppThemeMode.DARK_MODE -> true
    else -> isSystemInDarkTheme()
}