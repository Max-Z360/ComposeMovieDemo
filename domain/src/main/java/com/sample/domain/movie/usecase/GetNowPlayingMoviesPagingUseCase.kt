package com.sample.domain.movie.usecase

import com.sample.domain.repository.MovieRepository
import javax.inject.Inject

class GetNowPlayingMoviesPagingUseCase @Inject constructor(
    private val movieRepository: MovieRepository
) {
    operator fun invoke() = movieRepository.getNowPlayingPagingMovies()
}