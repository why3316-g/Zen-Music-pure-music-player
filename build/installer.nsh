!macro customInstall
  StrCpy $R0 "$INSTDIR\Zen·Music.exe"
  ; Audio
  !insertmacro RegisterExt mp3 "MP3 Audio"
  !insertmacro RegisterExt flac "FLAC Audio"
  !insertmacro RegisterExt wav "WAV Audio"
  !insertmacro RegisterExt ogg "OGG Audio"
  !insertmacro RegisterExt aac "AAC Audio"
  !insertmacro RegisterExt m4a "M4A Audio"
  !insertmacro RegisterExt wma "WMA Audio"
  !insertmacro RegisterExt ape "APE Audio"
  !insertmacro RegisterExt alac "ALAC Audio"
  !insertmacro RegisterExt opus "Opus Audio"
  !insertmacro RegisterExt aiff "AIFF Audio"
  !insertmacro RegisterExt aif "AIFF Audio"
  !insertmacro RegisterExt mid "MIDI Audio"
  !insertmacro RegisterExt midi "MIDI Audio"
  !insertmacro RegisterExt dsf "DSF Audio"
  !insertmacro RegisterExt dff "DFF Audio"
  !insertmacro RegisterExt wv "WavPack Audio"
  !insertmacro RegisterExt tta "TTA Audio"
  !insertmacro RegisterExt ac3 "AC3 Audio"
  !insertmacro RegisterExt dts "DTS Audio"
  ; Video
  !insertmacro RegisterExt mp4 "MP4 Video"
  !insertmacro RegisterExt mkv "MKV Video"
  !insertmacro RegisterExt avi "AVI Video"
  !insertmacro RegisterExt webm "WebM Video"
  !insertmacro RegisterExt mov "MOV Video"
  !insertmacro RegisterExt wmv "WMV Video"
  !insertmacro RegisterExt flv "FLV Video"
  !insertmacro RegisterExt 3gp "3GP Video"
  !insertmacro RegisterExt m4v "M4V Video"
  !insertmacro RegisterExt mpeg "MPEG Video"
  !insertmacro RegisterExt mpg "MPEG Video"
!macroend

!macro customUnInstall
  ; Audio
  !insertmacro UnregisterExt mp3
  !insertmacro UnregisterExt flac
  !insertmacro UnregisterExt wav
  !insertmacro UnregisterExt ogg
  !insertmacro UnregisterExt aac
  !insertmacro UnregisterExt m4a
  !insertmacro UnregisterExt wma
  !insertmacro UnregisterExt ape
  !insertmacro UnregisterExt alac
  !insertmacro UnregisterExt opus
  !insertmacro UnregisterExt aiff
  !insertmacro UnregisterExt aif
  !insertmacro UnregisterExt mid
  !insertmacro UnregisterExt midi
  !insertmacro UnregisterExt dsf
  !insertmacro UnregisterExt dff
  !insertmacro UnregisterExt wv
  !insertmacro UnregisterExt tta
  !insertmacro UnregisterExt ac3
  !insertmacro UnregisterExt dts
  ; Video
  !insertmacro UnregisterExt mp4
  !insertmacro UnregisterExt mkv
  !insertmacro UnregisterExt avi
  !insertmacro UnregisterExt webm
  !insertmacro UnregisterExt mov
  !insertmacro UnregisterExt wmv
  !insertmacro UnregisterExt flv
  !insertmacro UnregisterExt 3gp
  !insertmacro UnregisterExt m4v
  !insertmacro UnregisterExt mpeg
  !insertmacro UnregisterExt mpg
!macroend

!macro RegisterExt _ext _name
  WriteRegStr HKCR "ZenMusic.${_ext}\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.${_ext}" "" "${_name}"
  WriteRegStr HKCR ".${_ext}\OpenWithProgids" "ZenMusic.${_ext}" ""
!macroend

!macro UnregisterExt _ext
  DeleteRegKey HKCR "ZenMusic.${_ext}"
  DeleteRegValue HKCR ".${_ext}\OpenWithProgids" "ZenMusic.${_ext}"
!macroend
