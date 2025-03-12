package com.sample.data.local.realmdb

import com.sample.data.local.realmdb.entity.ActorRealmEntity
import com.sample.data.local.realmdb.entity.GenreRealmEntity
import com.sample.data.local.realmdb.entity.MovieRealmEntity
import io.realm.kotlin.Realm
import io.realm.kotlin.RealmConfiguration

val RealmDatabase = Realm.open(
    RealmConfiguration
        .Builder(
            schema = setOf(
                MovieRealmEntity::class,
                ActorRealmEntity::class,
                GenreRealmEntity::class
            )
        )
        .name("movies.realm")
        .build()
)
