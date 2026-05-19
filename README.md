# El Impostor

Juego web online por salas usando Firebase Realtime Database.

## Como probarlo

1. Crea un proyecto en Firebase.
2. En Firebase, crea una app web.
3. Copia la configuracion que te da Firebase.
4. Pegala en `firebase-config.js`.
5. En Firebase, activa Realtime Database.
6. Para probar mientras desarrollas, podes usar estas reglas:

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true
    }
  }
}
```

Estas reglas son solo para probar. Mas adelante conviene agregar login anonimo o reglas mas cerradas.

## Flujo

- Un jugador crea una sala.
- Copia el link de invitacion.
- Los demas abren el link y entran con su nombre.
- Con 4 a 10 jugadores, el lider inicia la partida.
- Cada jugador ve su rol en su propia pantalla.
- El lider pasa a mesa, maneja turnos y abre votacion.
- Cada jugador vota desde su pantalla.
- Cuando votan todos, se revela el impostor.
