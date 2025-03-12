package com.sample.domain.movie.usecase

import com.sample.domain.repository.MovieRepository
import javax.inject.Inject

class SearchMoviesPagingUseCase @Inject constructor(
    private val movieRepository: MovieRepository,
) {
    operator fun invoke(query: String) = movieRepository.searchPagingMovies(query)
}