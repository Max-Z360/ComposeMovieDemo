package com.sample.domain.movie.usecase

import com.sample.domain.DispatcherProvider
import com.sample.domain.repository.MovieRepository
import kotlinx.coroutines.withContext
import javax.inject.Inject

class GetMovieDetailUseCase @Inject constructor(
    private val movieRepository: MovieRepository,
    private val dispatcherProvider: DispatcherProvider
) {
    suspend operator fun invoke(params: Int) = withContext(dispatcherProvider.io()) {
        movieRepository.getMovieDetails(params)
    }
}