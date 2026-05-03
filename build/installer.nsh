!macro customInstall
  StrCpy $R0 "$INSTDIR\Zen·Music.exe"
  ; mp3
  WriteRegStr HKCR "ZenMusic.mp3\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.mp3" "" "MP3 Audio"
  WriteRegStr HKCR ".mp3\OpenWithProgids" "ZenMusic.mp3" ""
  ; flac
  WriteRegStr HKCR "ZenMusic.flac\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.flac" "" "FLAC Audio"
  WriteRegStr HKCR ".flac\OpenWithProgids" "ZenMusic.flac" ""
  ; wav
  WriteRegStr HKCR "ZenMusic.wav\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.wav" "" "WAV Audio"
  WriteRegStr HKCR ".wav\OpenWithProgids" "ZenMusic.wav" ""
  ; ogg
  WriteRegStr HKCR "ZenMusic.ogg\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.ogg" "" "OGG Audio"
  WriteRegStr HKCR ".ogg\OpenWithProgids" "ZenMusic.ogg" ""
  ; aac
  WriteRegStr HKCR "ZenMusic.aac\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.aac" "" "AAC Audio"
  WriteRegStr HKCR ".aac\OpenWithProgids" "ZenMusic.aac" ""
  ; m4a
  WriteRegStr HKCR "ZenMusic.m4a\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.m4a" "" "M4A Audio"
  WriteRegStr HKCR ".m4a\OpenWithProgids" "ZenMusic.m4a" ""
  ; wma
  WriteRegStr HKCR "ZenMusic.wma\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.wma" "" "WMA Audio"
  WriteRegStr HKCR ".wma\OpenWithProgids" "ZenMusic.wma" ""
  ; mp4
  WriteRegStr HKCR "ZenMusic.mp4\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.mp4" "" "MP4 Video"
  WriteRegStr HKCR ".mp4\OpenWithProgids" "ZenMusic.mp4" ""
  ; mkv
  WriteRegStr HKCR "ZenMusic.mkv\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.mkv" "" "MKV Video"
  WriteRegStr HKCR ".mkv\OpenWithProgids" "ZenMusic.mkv" ""
  ; avi
  WriteRegStr HKCR "ZenMusic.avi\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.avi" "" "AVI Video"
  WriteRegStr HKCR ".avi\OpenWithProgids" "ZenMusic.avi" ""
  ; webm
  WriteRegStr HKCR "ZenMusic.webm\shell\open\command" "" '"$R0" "%1"'
  WriteRegStr HKCR "ZenMusic.webm" "" "WebM Video"
  WriteRegStr HKCR ".webm\OpenWithProgids" "ZenMusic.webm" ""
!macroend
