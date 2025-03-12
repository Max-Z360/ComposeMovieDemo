package com.sample.data.network.movie.mapper

import com.sample.data.network.movie.response.MovieResponse
import com.sample.data.network.ktor.IMAGE_BASE_URL
import com.sample.domain.home.model.MovieVo
import com.sample.domain.movie.model.GenreVo
import com.sample.shared.extension.orZero
import javax.inject.Inject

 
class MovieVoMapper @Inject constructor() {
    fun map(item: MovieResponse?, genres: List<GenreVo>): MovieVo {
        return MovieVo(
            id = item?.id.orZero(),
            title = item?.title.orEmpty(),
            overview = item?.overview.orEmpty(),
            backdropPath = IMAGE_BASE_URL + item?.backdropPath.orEmpty(),
            posterPath = IMAGE_BASE_URL + item?.posterPath.orEmpty(),
            releaseDate = item?.releaseDate.orEmpty(),
            voteAverage = item?.voteAverage.orZero().toFloat(),
            genreIds = item?.genreIds?.map {
                genres.find { genre -> genre.id == it }?.name.orEmpty()
            }.orEmpty(),
        )
    }
}