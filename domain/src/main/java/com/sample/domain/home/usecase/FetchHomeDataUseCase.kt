package com.sample.domain.home.usecase

import com.sample.domain.DispatcherProvider
import com.sample.domain.repository.ActorRepository
import com.sample.domain.repository.MovieRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import javax.inject.Inject

class FetchHomeDataUseCase @Inject constructor(
    private val dispatcherProvider: DispatcherProvider,
    private val movieRepository: MovieRepository,
    private val actorRepository: ActorRepository
) {
    suspend operator fun invoke() = withContext(dispatcherProvider.io()) {
        coroutineScope {
            async { movieRepository.fetchNowPlayingMovies() }.await()
            async { movieRepository.fetchUpComingMovies() }.await()
            async { movieRepository.fetchPopularMovies() }.await()
            async { actorRepository.fetchPopularPeople() }.await()
        }
    }
}