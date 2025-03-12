package com.sample.mz.composable


//@Composable
//fun Modifier.shimmerLoadingAnimation(
//    showShimmer: Boolean,
//    widthOfShadowBrush: Int = 500,
//    angleOfAxisY: Float = 270f,
//    durationMillis: Int = 1000,
//): Modifier {
//
//    val shimmerColors = listOf(
//        Color.White.copy(alpha = 0.3f),
//        Color.White.copy(alpha = 0.5f),
//        Color.White.copy(alpha = 1.0f),
//        Color.White.copy(alpha = 0.5f),
//        Color.White.copy(alpha = 0.3f),
//    )
//    val noShimmerColors = listOf(Color.Transparent, Color.Transparent)
//
//    val transition = rememberInfiniteTransition(label = "")
//    val translateAnimation = transition.animateFloat(
//        initialValue = 0f,
//        targetValue = (durationMillis + widthOfShadowBrush).toFloat(),
//        animationSpec = infiniteRepeatable(
//            animation = tween(
//                durationMillis = durationMillis,
//                easing = LinearEasing,
//            ),
//            repeatMode = RepeatMode.Restart,
//        ),
//        label = "Shimmer loading animation",
//    )
//
//
//    return this.background(
//        brush = Brush.linearGradient(
//            colors = if (showShimmer) shimmerColors else noShimmerColors,
//            start = Offset(x = translateAnimation.value - widthOfShadowBrush, y = 0.0f),
//            end = Offset(x = translateAnimation.value, y = angleOfAxisY),
//        ),
//    )
//
//}