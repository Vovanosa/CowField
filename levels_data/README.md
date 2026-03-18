# Levels Data

This directory stores authored level files as project data.

Structure:

- `levels_data/light/<levelNumber>.json`
- `levels_data/easy/<levelNumber>.json`
- `levels_data/medium/<levelNumber>.json`
- `levels_data/hard/<levelNumber>.json`

The backend API in `server/` treats these files as the source of truth.
