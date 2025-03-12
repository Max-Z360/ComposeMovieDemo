package com.sample.mz.composable

import androidx.annotation.DrawableRes
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import com.sample.mz.ui.theme.Dimens

@Composable
fun IconAndTextInfoRow(
    @DrawableRes painterResources: Int,
    iconSize: Dp = Dp.Unspecified,
    text: String,
    fontSize: TextUnit = Dimens.TEXT_SMALL
) {
    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            painter = painterResource(id = painterResources),
            contentDescription = null,
            modifier = Modifier.size(iconSize)
        )
        Spacer(modifier = Modifier.width(Dimens.MARGIN_MEDIUM))
        Text(
            text = text,
            fontSize = fontSize,
        )
    }
}