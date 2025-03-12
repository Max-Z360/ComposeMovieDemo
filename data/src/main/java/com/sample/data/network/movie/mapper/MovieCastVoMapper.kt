package com.sample.data.network.movie.mapper

import com.sample.data.network.movie.response.MovieDetailCreditsResponse
import com.sample.data.network.ktor.IMAGE_BASE_URL
import com.sample.domain.movie.model.MovieCastVo
import com.sample.shared.extension.orFalse
import com.sample.shared.extension.orZero
import com.sample.shared.mapper.UnidirectionalMap
import javax.inject.Inject

class MovieCastVoMapper @Inject constructor() :
    UnidirectionalMap<MovieDetailCreditsResponse.Cast?, MovieCastVo> {
    override fun map(item: MovieDetailCreditsResponse.Cast?): MovieCastVo {
        return MovieCastVo(
            adult = item?.adult.orFalse(),
            gender = item?.gender.orZero(),
            id = item?.id.orZero(),
            knownForDepartment = item?.knownForDepartment.orEmpty(),
            name = item?.name.orEmpty(),
            originalName = item?.originalName.orEmpty(),
            popularity = item?.popularity.orZero(),
            profilePath = IMAGE_BASE_URL + item?.profilePath.orEmpty(),
            castId = item?.castId.orZero(),
            character = item?.character.orEmpty(),
            creditId = item?.creditId.orEmpty(),
            order = item?.order.orZero()
        )
    }
}