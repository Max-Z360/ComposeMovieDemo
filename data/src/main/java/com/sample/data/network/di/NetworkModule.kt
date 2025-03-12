package com.sample.data.network.di

import android.content.Context
import com.chuckerteam.chucker.api.ChuckerCollector
import com.chuckerteam.chucker.api.ChuckerInterceptor
import com.chuckerteam.chucker.api.RetentionManager
import com.sample.shared.BuildConfig
import com.sample.data.network.ktor.AuthTokenInterceptor
import com.sample.data.network.ktor.ktorHttpClient
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.ktor.client.HttpClient
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideChuckerInterceptor(@ApplicationContext context: Context): ChuckerInterceptor {
        // Create the Collector
        val chuckerCollector = ChuckerCollector(
            context = context,
            showNotification = true,
            retentionPeriod = RetentionManager.Period.ONE_HOUR
        )
        // Create the Interceptor
        return ChuckerInterceptor.Builder(context)
            .collector(chuckerCollector)
            .maxContentLength(250_000L)
            .redactHeaders("Auth-Token", "Bearer")
            .alwaysReadResponseBody(true)
            .createShortcut(BuildConfig.DEBUG)
            .build()
    }

    @Provides
    @Singleton
    fun provideKtorClient(
        authTokenInterceptor: AuthTokenInterceptor,
        chuckerInterceptor: ChuckerInterceptor,
    ): HttpClient {
        val interceptors =
            listOfNotNull(authTokenInterceptor, chuckerInterceptor.takeIf { BuildConfig.DEBUG })
        return ktorHttpClient(interceptors)
    }

}