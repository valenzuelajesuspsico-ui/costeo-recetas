# Costeo de Recetas

Calculadora de costos de recetas con biblioteca de recetas y precios de referencia para Tijuana, B.C. Funciona sin internet una vez instalada.

App: https://valenzuelajesuspsico-ui.github.io/costeo-recetas/

## Qué hay en el repositorio

- `index.html`: la aplicación completa (un solo archivo). **Se genera; no se edita a mano.**
- `sw.js`: hace que la app funcione sin internet y tome la versión nueva cuando hay señal. **Se genera.**
- `manifest.json`, `icon-*.png`: permiten instalarla como app en el teléfono.
- `fuente/`: los archivos de trabajo de donde sale la app.
  - `plantilla.html`: diseño y programa de la app.
  - `base.js`, `libro/`, `seed/`: recetas, consejos, tiendas y precios base.
  - `precios.json`: precios actualizados cada semana (mandan sobre los precios base).
  - `logo/`: logo que aparece en la hoja compartida.
  - `respaldo/index.html`: portada de la copia de respaldo.
  - `build.js`: une todo y escribe `index.html` y `sw.js`.

## Cómo se actualiza

1. Cambiar lo necesario dentro de `fuente/`.
2. Ejecutar `node fuente/build.js` (no necesita instalar nada).
3. Subir los cambios a la rama `main`. GitHub Pages publica en uno o dos minutos y la app toma la versión nueva la siguiente vez que se abre con internet.

`node fuente/build.js --precios` imprime la lista de precios vigente sin escribir nada.

Los precios se actualizan cada lunes de forma automática: la tarea solo cambia `fuente/precios.json` y vuelve a generar la app.
