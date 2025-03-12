package com.sample.data.local.roomdb.datasource_impl

import androidx.room.withTransaction
import com.sample.data.local.datasource.GenreDataSource
import com.sample.data.local.roomdb.AppDatabase
import com.sample.data.local.roomdb.entities.GenreEntity
import com.sample.data.network.movie.response.GenresResponse
import com.sample.data.network.movie.response.toGenreEntity
import com.sample.domain.movie.model.GenreVo
import javax.inject.Inject

class GenreRoomDataSourceImpl @Inject constructor(
    private val database: AppDatabase
) : GenreDataSource {
    override suspend fun insertGenres(list: List<GenresResponse.Genre?>) {
        database.withTransaction {
            database.genreDao().clearGenres()
            database.genreDao().insertGenres(
                list.map {
                    it.toGenreEntity()
                }
            )
        }
    }

    override suspend fun getGenreById(id: Int): GenreVo {
        return database.genreDao().getGenreById(id).toGenreVo()
    }

    override suspend fun getAllGenres(): List<GenreVo> {
        return database.genreDao().getAllGenres().map(GenreEntity::toGenreVo)
    }
}