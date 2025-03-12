package com.sample.data.repository

import com.sample.data.local.datasource.ActorDataSource
import com.sample.data.network.movie.MovieApiService
import com.sample.domain.home.model.ActorVo
import com.sample.domain.repository.ActorRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class ActorRepositoryImpl @Inject constructor(
    private val apiService: MovieApiService,
    private val actorDataSource: ActorDataSource
) : ActorRepository {
    override suspend fun fetchPopularPeople() {
        val raw = apiService.getPopularPeople()
        actorDataSource.insertActors(raw.data.orEmpty())
    }

    override fun getDbPopularPeople(): Flow<List<ActorVo>> {
        return actorDataSource.getAllActors()
    }
}