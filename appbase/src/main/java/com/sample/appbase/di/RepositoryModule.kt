package com.sample.appbase.di

import com.sample.data.repository.CacheRepositoryImpl
import com.sample.data.repository.ActorRepositoryImpl
import com.sample.data.repository.MovieRepositoryImpl
import com.sample.domain.repository.ActorRepository
import com.sample.domain.repository.CacheRepository
import com.sample.domain.repository.MovieRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.android.components.ViewModelComponent

 

@Module
@InstallIn(ViewModelComponent::class)
abstract class RepositoryModule {
    @Binds
    abstract fun bindMovieRepository(repositoryImpl: MovieRepositoryImpl): MovieRepository

    @Binds
    abstract fun bindActorRepository(repository: ActorRepositoryImpl): ActorRepository

    @Binds
    abstract fun bindCacheRepository(repository: CacheRepositoryImpl): CacheRepository
}