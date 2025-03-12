package com.sample.data.network.movie.mapper

import com.sample.data.network.movie.response.ActorResponse
import com.sample.data.network.ktor.IMAGE_BASE_URL
import com.sample.domain.home.model.ActorVo
import com.sample.shared.extension.orFalse
import com.sample.shared.extension.orZero
import com.sample.shared.mapper.UnidirectionalMap
import javax.inject.Inject

class ActorVoMapper @Inject constructor() : UnidirectionalMap<ActorResponse?, ActorVo> {
    override fun map(item: ActorResponse?): ActorVo {
        return ActorVo(
            adult = item?.adult.orFalse(),
            gender = item?.gender.orZero(),
            id = item?.id.orZero(),
            knownForDepartment = item?.knownForDepartment.orEmpty(),
            name = item?.name.orEmpty(),
            originalName = item?.originalName.orEmpty(),
            popularity = item?.popularity.orZero(),
            profilePath = IMAGE_BASE_URL + item?.profilePath.orEmpty()
        )
    }
}