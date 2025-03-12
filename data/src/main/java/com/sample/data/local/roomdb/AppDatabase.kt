package com.sample.data.local.roomdb

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.sample.data.local.roomdb.dao.ActorDao
import com.sample.data.local.roomdb.dao.MovieDao
import com.sample.data.local.roomdb.entities.ActorEntity
import com.sample.data.local.roomdb.entities.GenreEntity
import com.sample.data.local.roomdb.entities.MovieEntity
import com.sample.data.local.roomdb.typeconverter.IntegerListConverter
import com.sample.data.local.roomdb.typeconverter.StringListConverter
import com.sample.data.local.roomdb.dao.GenreDao

@Database(
    entities = [
        MovieEntity::class,
        ActorEntity::class,
        GenreEntity::class
    ],
    version = 5,
    exportSchema = false
)
@TypeConverters(
    IntegerListConverter::class,
    StringListConverter::class,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun movieDao(): MovieDao
    abstract fun actorDao(): ActorDao
    abstract fun genreDao(): GenreDao
}