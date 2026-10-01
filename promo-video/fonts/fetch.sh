#!/usr/bin/env bash
# Re-download the local Google Fonts (OFL) used by src/fonts.css from the google/fonts GitHub repo.
set -euo pipefail
cd "$(dirname "$0")"
B="https://raw.githubusercontent.com/google/fonts/main/ofl"
dl(){ [ -s "$2" ] && { echo "have $2"; return; }; curl -sS -fL --max-time 120 -o "$2" "$1" && echo "OK $2"; }
dl "$B/inter/Inter%5Bopsz%2Cwght%5D.ttf" Inter-Variable.ttf
dl "$B/inter/Inter-Italic%5Bopsz%2Cwght%5D.ttf" Inter-Italic-Variable.ttf
dl "$B/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf" PlayfairDisplay-Variable.ttf
dl "$B/playfairdisplay/PlayfairDisplay-Italic%5Bwght%5D.ttf" PlayfairDisplay-Italic-Variable.ttf
dl "$B/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf" Fraunces-Variable.ttf
dl "$B/fraunces/Fraunces-Italic%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf" Fraunces-Italic-Variable.ttf
dl "$B/instrumentserif/InstrumentSerif-Regular.ttf" InstrumentSerif-Regular.ttf
dl "$B/instrumentserif/InstrumentSerif-Italic.ttf" InstrumentSerif-Italic.ttf
dl "$B/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf" DMSans-Variable.ttf
dl "$B/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf" SpaceGrotesk-Variable.ttf
dl "$B/manrope/Manrope%5Bwght%5D.ttf" Manrope-Variable.ttf
dl "$B/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" JetBrainsMono-Variable.ttf
dl "$B/syne/Syne%5Bwght%5D.ttf" Syne-Variable.ttf
dl "$B/dmserifdisplay/DMSerifDisplay-Regular.ttf" DMSerifDisplay-Regular.ttf
dl "$B/dmserifdisplay/DMSerifDisplay-Italic.ttf" DMSerifDisplay-Italic.ttf
dl "$B/bricolagegrotesque/BricolageGrotesque%5Bopsz%2Cwdth%2Cwght%5D.ttf" BricolageGrotesque-Variable.ttf
dl "$B/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf" CormorantGaramond-Variable.ttf
dl "$B/cormorantgaramond/CormorantGaramond-Italic%5Bwght%5D.ttf" CormorantGaramond-Italic-Variable.ttf
dl "$B/newsreader/Newsreader%5Bopsz%2Cwght%5D.ttf" Newsreader-Variable.ttf
dl "$B/newsreader/Newsreader-Italic%5Bopsz%2Cwght%5D.ttf" Newsreader-Italic-Variable.ttf
dl "$B/geist/Geist%5Bwght%5D.ttf" Geist-Variable.ttf
dl "$B/geistmono/GeistMono%5Bwght%5D.ttf" GeistMono-Variable.ttf
dl "$B/notosanssc/NotoSansSC%5Bwght%5D.ttf" NotoSansSC-Variable.ttf
