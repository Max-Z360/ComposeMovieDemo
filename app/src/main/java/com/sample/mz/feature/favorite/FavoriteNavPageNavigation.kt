package com.sample.mz.feature.favorite

import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavOptions
import androidx.navigation.compose.composable
import com.sample.mz.navigation.NavRoute

fun NavGraphBuilder.favoriteNavPage() {
    composable<NavRoute.FavoritePage> {
        FavoriteNavPage()
    }
}

fun NavController.navigateToFavoriteNavPage(navOptions: NavOptions? = null) =
    navigate(NavRoute.FavoritePage, navOptions)
