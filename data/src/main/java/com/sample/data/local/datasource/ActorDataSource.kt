package com.sample.data.local.datasource

import com.sample.data.network.movie.response.ActorResponse
import com.sample.domain.home.model.ActorVo
import kotlinx.coroutines.flow.Flow

interface ActorDataSource {
    suspend fun insertActors(list: List<ActorResponse>)
    fun getAllActors(): Flow<List<ActorVo>>
}