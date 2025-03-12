package com.sample.shared.mapper

interface UnidirectionalSuspendMap<F, T> {

    suspend fun map(item: F): T
}

