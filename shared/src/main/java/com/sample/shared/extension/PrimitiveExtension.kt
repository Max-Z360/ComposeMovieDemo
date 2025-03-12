package com.sample.shared.extension

infix fun <T> Boolean.then(valueIfTrue: T): Pair<Boolean, T> = Pair(this, valueIfTrue)
infix fun <T> Pair<Boolean, T>.or(valueIfFalse: T): T =
    if (this.first) this.second else valueIfFalse