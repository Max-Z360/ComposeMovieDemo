package com.sample.mz.feature.profile

import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavOptions
import androidx.navigation.compose.composable
import com.sample.mz.navigation.NavRoute

fun NavGraphBuilder.profileNavPage() {
    composable<NavRoute.ProfilePage> {
        ProfileNavPage()
    }
}

fun NavController.navigateToProfileNavPage(navOptions: NavOptions? = null) =
    navigate(NavRoute.ProfilePage, navOptions)