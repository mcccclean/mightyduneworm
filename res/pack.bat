set IN=exportedsprites
set OUT=.
set PACKFILE=sprites
java -cp gdx.jar;gdx-tools.jar com.badlogic.gdx.tools.texturepacker.TexturePacker %IN% %OUT% %PACKFILE%
python atlastojson.py
