package com.sample.domain.movie.usecase

import com.sample.domain.DispatcherProvider
import com.sample.domain.repository.MovieRepository
import kotlinx.coroutines.withContext
import javax.inject.Inject

class GetGenreByIdUseCase @Inject constructor(
    private val movieRepository: MovieRepository,
    private val dispatcherProvider: DispatcherProvider
) {
    suspend operator fun invoke(id: Int) = withContext(dispatcherProvider.io()) {
        movieRepository.getGenreById(id)
    }
}