package com.sample.domain.home.usecase

import com.sample.domain.home.model.MovieVo
import com.sample.domain.repository.MovieRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject


class GetPopularMoviesUseCase @Inject constructor(
    private val movieRepository: MovieRepository
) {
    operator fun invoke(): Flow<List<MovieVo>> = movieRepository.getDbPopularMovies()
}