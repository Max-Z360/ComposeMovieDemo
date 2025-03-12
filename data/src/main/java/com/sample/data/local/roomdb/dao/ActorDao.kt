package com.sample.data.local.roomdb.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.sample.data.local.roomdb.entities.ActorEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ActorDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActors(list: List<ActorEntity>)

    @Query("SELECT * FROM actor")
    fun getAllActors(): Flow<List<ActorEntity>>

    @Query("DELETE FROM actor")
    suspend fun clearActors()
}