package com.sample.mz.feature.movie

import androidx.compose.animation.ExperimentalSharedTransitionApi
import androidx.compose.animation.SharedTransitionScope
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavOptions
import androidx.navigation.compose.composable
import com.sample.mz.navigation.NavRoute


@OptIn(ExperimentalSharedTransitionApi::class)
fun NavGraphBuilder.movieNavPage(
    navController: NavController,
    sharedTransitionScope: SharedTransitionScope
) {
    composable<NavRoute.MoviePage> {
        MovieNavPage(

        )
    }
}

fun NavController.navigateToMovieNavPage(navOptions: NavOptions? = null) =
    navigate(NavRoute.MoviePage, navOptions)


