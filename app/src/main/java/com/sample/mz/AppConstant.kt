package com.sample.mz

import com.sample.domain.general.Localization

object AppConstant {
    const val NowPlayingMoviesKey = "nowPlaying-image-%s"
    const val ComingSoonMoviesKey = "comingSoon-image-%s"
    const val PromotionMoviesKey = "promotion-image-%s"
    const val ListingMoviesKey = "listing-image-%s"

    val languageList = listOf(
        Localization(R.string.locale_english, Localization.ENGLISH),
        Localization(R.string.locale_myanmar, Localization.MYANMAR)
    )
}