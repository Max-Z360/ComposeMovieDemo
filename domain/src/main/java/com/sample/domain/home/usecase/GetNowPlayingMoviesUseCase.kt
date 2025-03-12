package com.sample.domain.home.usecase

import com.sample.domain.repository.MovieRepository
import javax.inject.Inject

 
class GetNowPlayingMoviesUseCase @Inject constructor(
    private val movieRepository: MovieRepository
) {
    operator fun invoke() = movieRepository.getDbNowPlayingMovies()
}