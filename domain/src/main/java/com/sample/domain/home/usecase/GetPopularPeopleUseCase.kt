package com.sample.domain.home.usecase

import com.sample.domain.repository.ActorRepository
import javax.inject.Inject

 
class GetPopularPeopleUseCase @Inject constructor(
    private val actorRepository: ActorRepository
) {
    operator fun invoke() = actorRepository.getDbPopularPeople()

}