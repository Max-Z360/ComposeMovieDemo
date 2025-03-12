package com.sample.mz.composable

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.painter.ColorPainter
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage

@Composable
fun CoilAsyncImage(
    imageUrl: String,
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(0)
) {
    AsyncImage(
        modifier = modifier
            .fillMaxSize()
            .clip(shape),
        model = imageUrl,
        placeholder = ColorPainter(Color.DarkGray),
        error = ColorPainter(Color.DarkGray),
        contentScale = ContentScale.Crop,
        contentDescription = null,
    )
}