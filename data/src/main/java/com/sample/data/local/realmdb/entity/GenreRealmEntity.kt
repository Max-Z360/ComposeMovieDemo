package com.sample.data.local.realmdb.entity

import com.sample.domain.movie.model.GenreVo
import io.realm.kotlin.types.RealmObject
import io.realm.kotlin.types.annotations.PrimaryKey

class GenreRealmEntity : RealmObject {
    @PrimaryKey
    var id: Int = 0
    var name: String = ""

    fun toGenreVo() = GenreVo(
        id = id,
        name = name
    )
}
