package com.sample.data.local.datasource

import com.sample.data.network.movie.response.GenresResponse
import com.sample.domain.movie.model.GenreVo

interface GenreDataSource {
    suspend fun insertGenres(list: List<GenresResponse.Genre?>)
    suspend fun getGenreById(id: Int): GenreVo
    suspend fun getAllGenres(): List<GenreVo>
}