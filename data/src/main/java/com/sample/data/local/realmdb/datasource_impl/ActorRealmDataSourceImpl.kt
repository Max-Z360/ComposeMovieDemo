package com.sample.data.local.realmdb.datasource_impl

import com.sample.data.local.datasource.ActorDataSource
import com.sample.data.local.realmdb.entity.ActorRealmEntity
import com.sample.data.network.movie.response.ActorResponse
import com.sample.domain.home.model.ActorVo
import io.realm.kotlin.Realm
import io.realm.kotlin.ext.query
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class ActorRealmDataSourceImpl @Inject constructor(
    private val realm: Realm
) : ActorDataSource {
    override suspend fun insertActors(list: List<ActorResponse>) {
        realm.write {
            delete(ActorRealmEntity::class)
            list.map { it.toActorRealmEntity() }.forEach { copyToRealm(it) }
        }
    }

    override fun getAllActors(): Flow<List<ActorVo>> {
        return realm.query<ActorRealmEntity>().asFlow()
            .map { it.list.map { it.toActorVo() } }
    }
}