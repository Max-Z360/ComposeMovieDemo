package com.sample.appbase.exceptionmapper

import com.sample.shared.mapper.UnidirectionalSuspendMap


interface ExceptionHandler : UnidirectionalSuspendMap<Throwable, String> {
    fun getCode(item: Throwable): Int
    suspend fun getErrorBody(item: Throwable): String?
}
