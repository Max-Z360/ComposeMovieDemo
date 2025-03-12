package com.sample.domain.repository

import com.sample.domain.home.model.ActorVo
import kotlinx.coroutines.flow.Flow

interface ActorRepository {
    suspend fun fetchPopularPeople()
    fun getDbPopularPeople(): Flow<List<ActorVo>>
}