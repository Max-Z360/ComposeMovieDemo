package com.sample.data.network.di

import com.sample.data.network.movie.MovieApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.components.ViewModelComponent
import io.ktor.client.HttpClient


@Module
@InstallIn(ViewModelComponent::class)
object MainServiceModule {
    @Provides
    fun provideMovieService(ktor: HttpClient): MovieApiService {
        return MovieApiService(ktor)
    }
}