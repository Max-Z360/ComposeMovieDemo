package com.sample.data.local.datasource

import com.sample.data.network.movie.response.MovieResponse
import com.sample.domain.home.model.MovieVo
import kotlinx.coroutines.flow.Flow

interface MovieDataSource {
    suspend fun insertMovies(
        list: List<MovieResponse>,
        isNowPlaying: Boolean = false,
        isUpComing: Boolean = false,
        isPopular: Boolean = false
    )

    fun getHomeMovies(
        isNowPlaying: Boolean = false,
        isUpComing: Boolean = false,
        isPopular: Boolean = false
    ): Flow<List<MovieVo>>

    suspend fun updateFavoriteMovie(movieId: Int)

    fun getFavoriteMovies(): Flow<List<MovieVo>>
}