package com.sample.domain.movie.usecase

import com.sample.domain.repository.MovieRepository
import javax.inject.Inject

class GetFavoriteMoviesUseCase @Inject constructor(
    private val repository: MovieRepository,
) {
    operator fun invoke() = repository.getDbFavoriteMovies()
}