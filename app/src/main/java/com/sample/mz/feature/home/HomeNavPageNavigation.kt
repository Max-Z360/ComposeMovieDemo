package com.sample.mz.feature.home

import androidx.compose.animation.ExperimentalSharedTransitionApi
import androidx.compose.animation.SharedTransitionScope
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavOptions
import androidx.navigation.compose.composable
import com.sample.mz.navigation.NavRoute

@OptIn(ExperimentalSharedTransitionApi::class)
fun NavGraphBuilder.homeNavPage(
    navController: NavController,
    sharedTransitionScope: SharedTransitionScope,
) {
    composable<NavRoute.HomePage> {
        HomeNavPage(
            navController = navController,
            sharedTransitionScope = sharedTransitionScope,
            animatedContentScope = this
        )
    }
}

fun NavController.navigateToHomeNavPage(navOptions: NavOptions? = null) =
    navigate(NavRoute.HomePage, navOptions)