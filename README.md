# 🕵️ Clue Detective Companion

Una libreta digital interactiva y asistente de deducción lógica para el clásico juego de mesa **Clue** (o **Cluedo**). Diseñada para sustituir las libretas de papel por una interfaz moderna, táctil, inteligente y con estética de novela policíaca noir.

---

## ✨ Características Principales

### 🧠 1. Asistente y Motor de Deducción Inteligente
- **Regla de unicidad**: En Clue solo existe 1 copia de cada carta. Al marcar que un jugador tiene una carta (`✓`), el asistente descarta automáticamente esa carta (`✕`) para los demás jugadores y para el sobre confidencial.
- **Deducción de Sobre Confidencial**: Si todos los jugadores activos descartan una carta (`✕`), se deduce inmediatamente que dicha carta se encuentra en el sobre del crimen (`★`).
- **Eliminación por descarte**: Si se descartan 5 de los 6 sospechosos (o 5 de las 6 armas, u 8 de las 9 habitaciones), el asistente identifica de inmediato al culpable restante.
- **Interruptor de Asistente**: ¿Prefieres jugar a la vieja usanza sin ayudas automáticas? Puedes desactivar el asistente con un solo clic.

### 📋 2. Libreta Interactiva y Adaptable
- **Tabla responsiva con cabeceras fijas**: La cabecera con los nombres de los jugadores y la primera columna con las cartas se mantienen siempre visibles tanto al desplazarse vertical como horizontalmente en móviles.
- **Ciclo táctil rápido en celdas**:
  - `·` **Vacío** (neutro)
  - `✕` **No tiene** (descartada)
  - `✓` **Tiene** (confirmada en posesión)
  - `?` **Duda / Preguntada**
- **Columna de Sobre Confidencial**: Marca directamente cartas en el sobre con estado `★` o descártalas con `✕`.
- **Filtros por categoría**: Filtra al instante por *Todos*, *¿Quién? (Sospechosos)*, *¿Con qué? (Armas)*, *¿Dónde? (Habitaciones)* o *Sin Resolver*.
- **Buscador instantáneo**: Encuentra cualquier carta rápidamente por nombre o alias.

### 📂 3. Dossier del Caso (Sobre Secreto)
- Panel superior con 3 fichas confidenciales en tiempo real:
  - 👤 **Sospechoso Homicida**
  - 🗡️ **Arma del Crimen**
  - 🚪 **Escenario del Crimen**
- Muestra el número de sospechosos restantes o el nombre confirmado con sello dorado.
- Banner de **¡CASO RESUELTO!** con botón de acusación final cuando se han descubierto las tres cartas.

### ✋ 4. Asistente de "Mi Mano Inicial"
- Al iniciar la partida, abre el modal de **Mi Mano** y marca con casillas de verificación las cartas que te fueron repartidas.
- Con un solo clic, se asignan a tu jugador y se descartan para todos los rivales y el sobre.

### 📝 5. Diario de Investigación y Preguntas
- Registra cada turno: quién formuló la sospecha, a quién se la preguntó y qué cartas involucró.
- Si el rival **pasó** (no tenía ninguna), marca automáticamente `✕` en las 3 cartas para ese jugador.
- Si el rival mostró una carta y fue a ti, anota la carta vista marcando `✓`.
- Historial cronológico visible para consultar sospechas pasadas.

### ↩️ 6. Deshacer Cambios (Undo)
- ¿Pulsaste por error una celda? Utiliza el botón **Deshacer** o presiona `Ctrl + Z` / `Cmd + Z` para restaurar el estado anterior.

### 📌 7. Notas por Carta
- Añade notas personalizadas a cualquier carta (ej. *"Juan o Pedro la tienen"*, *"Preguntada en ronda 2"*).

### 👥 8. Configuración de Jugadores
- Soporte para **2 a 6 jugadores**.
- Nombres de jugadores completamente editables.
- Identificador de **"Tú"** para destacar tu columna en la libreta.

### 🎨 9. Diseño Noir y Temas
- **Modo Detective Oscuro (Default)**: Tonos pizarra, azul noche y detalles en oro viejo.
- **Modo Claro**: Estilo papel y archivador clásico.
- Código de color distintivo para cada sospechoso (Verduzco, Mostaza, Marlene, Moradillo, Escarlata, Blanca) y sus armas y habitaciones asociadas.

### 💾 10. Persistencia Automática
- Todo el progreso se almacena localmente en `localStorage`. Si cierras el navegador o se bloquea tu teléfono, tu libreta permanecerá intacta al volver.

---

## 🃏 Cartas Incluidas (Edición en Español)

| Categoría | Elementos |
| :--- | :--- |
| **¿Quién? (Sospechosos)** | Verduzco (Verde), Mostaza, Marlene (Peacock), Moradillo (Plum), Escarlata, Blanca |
| **¿Con qué? (Armas)** | Candelabro, Daga, Tubo de plomo, Revólver, Soga, Llave inglesa |
| **¿Dónde? (Habitaciones)** | Salón de baile, Sala de billar, Terraza, Comedor, Pasillo, Cocina, Biblioteca, Sala, Estudio |

---

## 🚀 Cómo Ejecutar

La aplicación es completamente estática y no requiere instalar dependencias pesadas ni compiladores:

1. **Directamente en el navegador**:
   Haz doble clic en [index.html](file:///Users/emamut/workspace/emamut/clue-app/index.html) o arrástralo a Google Chrome, Firefox, Safari o Edge.

2. **Mediante un servidor local (opcional)**:
   ```bash
   # Con Python
   python3 -m http.server 8080

   # O con Node.js / npx
   npx serve .
   ```
   Luego abre `http://localhost:8080` en tu navegador o en tu móvil en la misma red Wi-Fi.

---

## 🛠️ Tecnologías

- **HTML5 & CSS3** (Variables CSS, Flexbox, CSS Grid, sticky positioning)
- **[Vue.js 3](https://vuejs.org/)** (Composition API mediante CDN, reactividad completa y sincronización reactiva)
- **[Bootstrap 5.3](https://getbootstrap.com/)** & **[Bootstrap Icons](https://icons.getbootstrap.com/)**
- **Web Storage API** (`localStorage`)
