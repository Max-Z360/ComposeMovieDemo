package com.sample.appbase.di

import com.sample.appbase.exceptionmapper.ExceptionHandler
import com.sample.appbase.exceptionmapper.ExceptionHandlerImpl
import com.sample.appbase.utils.DefaultDispatcherProvider
import com.sample.domain.DispatcherProvider
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
abstract class BaseAppModule {
    @Binds
    abstract fun exceptionMapper(exceptionMapperImpl: ExceptionHandlerImpl): ExceptionHandler

    @Binds
    abstract fun dispatcherProvider(dispatcherProvider: DefaultDispatcherProvider): DispatcherProvider
}