package com.sample.data.local.realmdb.datasource_impl

import com.sample.data.local.datasource.GenreDataSource
import com.sample.data.local.realmdb.entity.GenreRealmEntity
import com.sample.data.network.movie.response.GenresResponse
import com.sample.data.network.movie.response.toGenreRealEntity
import com.sample.domain.movie.model.GenreVo
import io.realm.kotlin.Realm
import io.realm.kotlin.ext.query
import javax.inject.Inject

class GenreRealmDataSourceImpl @Inject constructor(
    private val realm: Realm
) : GenreDataSource {
    override suspend fun insertGenres(list: List<GenresResponse.Genre?>) {
        realm.write {
            delete(GenreRealmEntity::class)
            list.forEach {
                copyToRealm(it.toGenreRealEntity())
            }
        }
    }

    override suspend fun getGenreById(id: Int): GenreVo {
        return realm.query<GenreRealmEntity>().find().first().toGenreVo()
    }

    override suspend fun getAllGenres(): List<GenreVo> {
        return realm.query<GenreRealmEntity>().find().map(GenreRealmEntity::toGenreVo)
    }
}