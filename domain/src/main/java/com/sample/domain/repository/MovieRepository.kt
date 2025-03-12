package com.sample.domain.repository

import androidx.paging.PagingData
import com.sample.domain.home.model.MovieVo
import com.sample.domain.movie.model.GenreVo
import com.sample.domain.movie.model.MovieDetailVo
import kotlinx.coroutines.flow.Flow

interface MovieRepository {
    suspend fun fetchNowPlayingMovies()
    suspend fun fetchUpComingMovies()
    suspend fun fetchPopularMovies()

    fun getDbNowPlayingMovies(): Flow<List<MovieVo>>
    fun getDbUpComingMovies(): Flow<List<MovieVo>>
    fun getDbPopularMovies(): Flow<List<MovieVo>>
    fun getDbFavoriteMovies(): Flow<List<MovieVo>>
    suspend fun favoriteDbMovie(movieId: Int)

    fun getNowPlayingPagingMovies(): Flow<PagingData<MovieVo>>
    fun getUpComingPagingMovies(): Flow<PagingData<MovieVo>>
    fun searchPagingMovies(query: String): Flow<PagingData<MovieVo>>

    //
    suspend fun getMovieDetails(movieId: Int): MovieDetailVo

    // movie genre
    suspend fun getMovieGenres()
    suspend fun getGenreById(id: Int): GenreVo
}