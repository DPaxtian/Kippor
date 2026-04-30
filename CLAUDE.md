# Kippor — instrucciones para Claude

## Git
- Trabajar siempre en la rama `dev`
- Solo hacer commit cuando el usuario lo pide explícitamente
- Si el usuario pide un commit, hacer solo ese commit y detenerse — no encadenar merge, push ni ninguna otra operación git
- El usuario pedirá cada operación git por separado
- Al hacer merge a main, regresar a `dev` después
- Bumpar versión en `app.json` siguiendo semver con cada commit
