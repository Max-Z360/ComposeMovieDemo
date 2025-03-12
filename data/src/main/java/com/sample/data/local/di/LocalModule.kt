package com.sample.data.local.di

import android.content.Context
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Room
import com.sample.data.local.datasource.ActorDataSource
import com.sample.data.local.datasource.GenreDataSource
import com.sample.data.local.datasource.MovieDataSource
import com.sample.data.local.roomdb.AppDatabase
import com.sample.data.local.realmdb.RealmDatabase
import com.sample.data.local.roomdb.datasource_impl.ActorRoomDataSourceImpl
import com.sample.data.local.roomdb.datasource_impl.GenreRoomDataSourceImpl
import com.sample.data.local.roomdb.datasource_impl.MovieRoomDataSourceImpl
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.components.ViewModelComponent
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.realm.kotlin.Realm
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(context, AppDatabase::class.java, "compose_movie_app.db")
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    @Singleton
    fun provideRealmDatabase(): Realm {
        return RealmDatabase
    }

    @Provides
    @Singleton
    fun providePreferenceDataStore(@ApplicationContext context: Context) = context.dataStore

    private val Context.dataStore by preferencesDataStore("pref.foodDi")

}

@Module
@InstallIn(ViewModelComponent::class)
abstract class DataSourceModule {
    @Binds
    abstract fun provideMovieDataSource(dataSource: MovieRoomDataSourceImpl): MovieDataSource

    @Binds
    abstract fun provideActorDataSource(dataSource: ActorRoomDataSourceImpl): ActorDataSource

    @Binds
    abstract fun provideGenreDataSource(dataSource: GenreRoomDataSourceImpl): GenreDataSource
}