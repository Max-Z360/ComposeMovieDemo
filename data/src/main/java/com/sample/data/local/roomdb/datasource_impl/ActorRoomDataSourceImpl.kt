package com.sample.data.local.roomdb.datasource_impl

import androidx.room.withTransaction
import com.sample.data.local.datasource.ActorDataSource
import com.sample.data.local.roomdb.AppDatabase
import com.sample.data.local.roomdb.entities.ActorEntity
import com.sample.data.network.movie.response.ActorResponse
import com.sample.domain.home.model.ActorVo
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class ActorRoomDataSourceImpl @Inject constructor(
    private val database: AppDatabase,
) : ActorDataSource {
    override suspend fun insertActors(list: List<ActorResponse>) {
        val data = list.map(ActorResponse::toActorEntity)
        database.withTransaction {
            database.actorDao().clearActors()
            database.actorDao().insertActors(data)
        }
    }

    override fun getAllActors(): Flow<List<ActorVo>> {
        return database.actorDao().getAllActors().map {
            it.map(ActorEntity::toActorVo)
        }
    }

}