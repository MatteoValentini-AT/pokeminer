@echo OFF
set last=""
set pokemon=""
:A
set last=%pokemon%
set /p pokemon="Enter Name:"
curl "https://img.pokemondb.net/sprites/emerald/normal/%pokemon%.png" --output "%userprofile%/Desktop/Pokemon Sprites/f_%pokemon%.png"
curl "https://img.pokemondb.net/sprites/emerald/back-normal/%pokemon%.png" --output "%userprofile%/Desktop/Pokemon Sprites/b_%pokemon%.png"
echo Grabing %pokemon%
if not (%pokemon%)==(%last%) goto A
