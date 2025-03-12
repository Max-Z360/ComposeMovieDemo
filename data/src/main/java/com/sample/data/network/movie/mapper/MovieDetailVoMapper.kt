package com.sample.data.network.movie.mapper

import com.sample.data.network.movie.response.MovieDetailCreditsResponse
import com.sample.data.network.movie.response.MovieDetailResponse
import com.sample.data.network.ktor.IMAGE_BASE_URL
import com.sample.domain.movie.model.MovieDetailVo
import com.sample.shared.extension.orFalse
import com.sample.shared.extension.orZero
import javax.inject.Inject

class MovieDetailVoMapper @Inject constructor(
    private val movieCastVoMapper: MovieCastVoMapper
) {
    fun map(item: MovieDetailResponse?, casts: MovieDetailCreditsResponse?): MovieDetailVo {
        return MovieDetailVo(
            id = item?.id.orZero(),
            adult = item?.adult.orFalse(),
            title = item?.title.orEmpty(),
            backdropPath = IMAGE_BASE_URL + item?.backdropPath.orEmpty(),
            posterPath = IMAGE_BASE_URL + item?.posterPath.orEmpty(),
            runtime = item?.runtime.orZero(),
            releaseDate = item?.releaseDate.orEmpty(),
            voteAverage = item?.voteAverage.orZero(),
            genres = item?.genres?.map {
                MovieDetailVo.Genre(
                    id = it?.id.orZero(),
                    name = it?.name.orEmpty()
                )
            }.orEmpty(),
            originalLanguage = item?.originalLanguage.orEmpty(),
            overview = item?.overview.orEmpty(),
            casts = casts?.cast?.map {
                movieCastVoMapper.map(it)
            }.orEmpty(),
            crews = casts?.crew?.map {
                movieCastVoMapper.map(it)
            }.orEmpty(),
        )
    }


}