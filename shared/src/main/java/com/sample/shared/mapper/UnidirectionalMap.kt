package com.sample.shared.mapper

interface UnidirectionalMap<F, T> {
    fun map(item: F): T
}
