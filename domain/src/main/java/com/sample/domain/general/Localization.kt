package com.sample.domain.general

import androidx.annotation.StringRes
import java.io.Serializable


data class Localization(
    @StringRes val title: Int,
    val localeCode: String
) : Serializable {
    companion object {
        const val ENGLISH = "en"
        const val MYANMAR = "ch"
    }
}

