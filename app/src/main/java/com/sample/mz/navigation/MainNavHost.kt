package com.sample.mz.navigation

import androidx.compose.animation.ExperimentalSharedTransitionApi
import androidx.compose.animation.SharedTransitionLayout
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import com.sample.mz.feature.favorite.favoriteNavPage
import com.sample.mz.feature.home.homeNavPage
import com.sample.mz.feature.movie.movieNavPage
import com.sample.mz.feature.profile.profileNavPage

@OptIn(ExperimentalSharedTransitionApi::class)
@Composable
fun MainNavHost(
    modifier: Modifier,
    appState: MainPageState,
    startDestination: NavRoute = NavRoute.HomePage
) {

    SharedTransitionLayout {
        NavHost(
            navController = appState.navController,
            startDestination = startDestination,
            modifier = modifier,
        ) {
            homeNavPage(appState.navController, this@SharedTransitionLayout)
            favoriteNavPage()
            movieNavPage(appState.navController, this@SharedTransitionLayout)
            profileNavPage()
        }
    }
}