package com.sample.data.local.roomdb.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.sample.domain.movie.model.GenreVo

@Entity(tableName = "genre")
data class GenreEntity(
    @PrimaryKey val id: Int,
    val name: String
) {
    fun toGenreVo() = GenreVo(
        id = id,
        name = name
    )
}
