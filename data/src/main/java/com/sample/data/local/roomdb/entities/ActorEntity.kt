package com.sample.data.local.roomdb.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.sample.data.network.ktor.IMAGE_BASE_URL
import com.sample.domain.home.model.ActorVo

 

@Entity(tableName = "actor")
data class ActorEntity(
    @PrimaryKey(autoGenerate = true) val tableId: Long = 0L,
    val adult: Boolean,
    val gender: Int,
    val id: Int,
    val knownForDepartment: String,
    val name: String,
    val originalName: String,
    val popularity: Double,
    val profilePath: String,
) {
    fun toActorVo() = ActorVo(
        adult = adult,
        gender = gender,
        id = id,
        knownForDepartment = knownForDepartment,
        name = name,
        originalName = originalName,
        popularity = popularity,
        profilePath = IMAGE_BASE_URL + profilePath
    )
}
