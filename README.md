# Congreso Argentino de Agroecología — aplicación web

Interfaz web del proyecto (React + Vite): paneles por rol (administración, comité académico, asistente, autor, evaluador), inscripción y flujos del congreso. Los datos de demostración se guardan en el **navegador** (`localStorage`); **no hay servidor backend** incluido en este proyecto.

---

## Requisitos previos

| Requisito | Notas |
|-----------|--------|
| **Node.js** | Versión **18 o superior** (recomendado: [LTS actual](https://nodejs.org/)). Incluye `npm`. |
| **Git** | **No es necesario.** El proyecto se entrega comprimido en un `.zip`; no hace falta clonar ningún repositorio. |
| **Navegador** | Chrome, Edge o Firefox actualizado. |

Comprobar versiones en una terminal:

```bash
node -v
npm -v
```

---

## 1. Obtener el proyecto (archivo ZIP)

1. Descarguen o reciban el archivo **`.zip`** del proyecto y **descomprímanlo** (clic derecho → “Extraer…” / “Descomprimir aquí”, o con el archivo del sistema).
2. Entren en la carpeta que quedó después de descomprimir. La **raíz del proyecto** es la carpeta que contiene el archivo **`package.json`** junto con `src/`, `index.html`, etc.
3. Si al descomprimir aparece una carpeta dentro de otra (por ejemplo `ProyectoJava/ProyectoJava/package.json`), usen siempre **la carpeta donde está ese `package.json`**.
4. Abran una terminal en esa raíz (`cd ruta/a/esa/carpeta` en macOS/Linux, o “Abrir en terminal” desde el explorador de archivos en Windows).

**Nota:** el archivo `.zip` **no incluye** la carpeta `node_modules` (las dependencias se instalan en su máquina con el siguiente paso). Si no ve esa carpeta tras descomprimir, es el comportamiento esperado.

---

## 2. Instalar dependencias

Es **obligatorio** ejecutar este paso antes de arrancar la web.

Qué hace **`npm install`**: lee **`package.json`** y **`package-lock.json`**, **descarga** las dependencias desde internet y las deja en una carpeta llamada **`node_modules`** dentro del proyecto. Esa carpeta **no viene en el archivo comprimido**; **se crea en su computadora** al terminar bien este comando. Sin este paso no existe `node_modules` y la aplicación no puede ejecutarse.

En la raíz del proyecto (donde está `package.json`):

```bash
npm install
```

Esperar a que termine sin errores. Si aparece un aviso de vulnerabilidades, suele bastar para la corrección; pueden ignorarse salvo que el entorno institucional lo prohíba.

---

## 3. Ejecutar la aplicación en modo desarrollo

```bash
npm run dev
```

Vite mostrará en la terminal una URL similar a:

- **http://localhost:5173**

Ábranla en el navegador. Si el puerto 5173 estuviera ocupado, Vite elegirá otro (lo indicará en la consola).

Para **detener** el servidor: en la terminal, `Ctrl+C`.

---

## 4. Compilar para producción (opcional)

Genera los archivos estáticos en la carpeta `dist/`:

```bash
npm run build
```

Para previsualizar el build sin instalar más dependencias:

```bash
npx vite preview
```

De nuevo seguir la URL que indique la terminal (por defecto suele ser `http://localhost:4173`).

---

## Cómo probar el inicio de sesión

1. Abran la app (`npm run dev`) y vayan a la ruta de **login** (normalmente **`/login`** desde la página principal o el menú según navegación).
2. En la misma pantalla aparece la sección **“Usuarios de prueba”** con emails y roles.
3. Para esos usuarios precargados, la **contraseña de demostración** es: **`12345678`**.

Los datos viven en el navegador. Si algo queda inconsistente al probar, pueden borrar el almacenamiento del sitio (o usar una ventana de incólogo) para volver a un estado fresco tras recargar.

---

## Flujo de la aplicación (cómo está armada la web)

Vista general: es un sitio del **Congreso Argentino de Agroecología** con **barra superior fija** (logo, enlaces públicos y acceso a cuenta). El contenido cambia según la ruta y, si hay usuario logueado, según el **rol** (administración, comité, asistente, autor, evaluador).

### 1. Entrada y navegación pública

- Al abrir la URL del servidor (por ejemplo `http://localhost:5173`) se muestra la **página de inicio** (`/`): información del congreso, ediciones anteriores y accesos destacados.
- Desde el **menú superior** (en pantallas anchas) pueden recorrer, entre otros: **Inicio**, **Historia**, **Circulares**, **Actividades**, **Mapas**, **Feria agroecológica**, **Organizadores**, **Contacto** y **Programa**. Esas secciones sirven para consultar información del evento sin necesidad de iniciar sesión.

### 2. Registro e inicio de sesión

- **Registrarse** (`/register`): alta de usuario (flujo de inscripción asociado al congreso).
- **Iniciar sesión** (`/login`): acceso con email y contraseña. En la misma pantalla se listan **usuarios de prueba** y la contraseña común indicada arriba.
- **Recuperación de contraseña** (`/forgot-password`): pantalla del flujo “olvidé mi contraseña”.

### 3. Después de iniciar sesión

- Si el usuario tiene **un solo rol**, la aplicación lo dirige al **panel** que corresponda.
- Si tiene **varios roles**, se solicita **elegir con qué rol operar** (`/select-role`); luego se accede al panel de ese rol.

### 4. Qué hace cada tipo de usuario (por rol)

Los paneles concentran las acciones de cada perfil. Las rutas principales son:

| Rol | Ruta principal del panel |
|-----|--------------------------|
| **Administrador/a** | `/admin` |
| **Comité académico** | `/comite-academico` |
| **Asistente** | `/asistente` |
| **Autor/a** | `/mis-presentaciones` |
| **Evaluador/a** | `/evaluador` |

#### Administrador/a (`/admin`)

- **Armado del programa:** accesos rápidos para crear y gestionar **mesas temáticas**, **mesas redondas**, **sesiones de pósters**, **talleres** y **conferencias** (cada tipo tiene su pantalla de alta/edición).
- **Publicación:** control de si el **programa** queda publicado o no para los visitantes.
- **Certificados:** configuración relacionada con la **disponibilidad de certificados de asistencia** (fechas visibles para los usuarios).
- **Inscripciones:** **validación y gestión** de inscripciones (aprobación, categorías, comprobantes de pago, facturación/comprobantes según el flujo, métodos transferencia o efectivo).
- **Indicadores:** estadísticas de **trabajos** (por tipo, modalidad, institución) e **inscripciones** (estado y método de pago); listados de quienes **adeudan pago** o **pagos en efectivo confirmados**.
- **Usuarios:** **alta, edición y baja** de cuentas; asignación de **roles** (asistente, autor, evaluador, comité, admin); **habilitar o deshabilitar** cuentas.
- **Solicitudes “ser autor”:** revisión de pedidos de usuarios que quieren el rol autor.
- **Cronograma:** edición del **cronograma general** del congreso (sesiones, pósters, mesas redondas, talleres y conferencias ya cargados en el sistema).
- **Circulares:** administración de **circulares** informativas.
- **Comunicación:** envío de **notificaciones** internas (también pueden filtrarse por rol).

#### Comité académico (`/comite-academico`)

Enfoque en el **circuito de trabajos científicos** antes y después de los evaluadores:

- **Fecha límite de envíos:** define hasta cuándo se aceptan **trabajos nuevos** (luego de esa fecha pueden seguir **reenvíos** por correcciones, según reglas del flujo).
- **Evaluadores por eje:** ve usuarios y puede **designar evaluadores** vinculados a un **eje temático** (con cupo máximo por eje), o quitarlos de un eje.
- **Trabajo seleccionado:** para cada envío, el flujo guiado es: **prevalidación (precheck)** formal (OK u observado) → **asignación de evaluadores** del mismo eje (típicamente 2; si hay empate en el voto, un **tercer** evaluador) → más adelante **confirmación final del comité** (aceptación o rechazo definitivo al congreso) cuando corresponda.
- **Emails:** panel de **últimos correos** registrados por el sistema (en entorno demo puede requerir variables de entorno para envío real por EmailJS).

#### Asistente (`/asistente`)

Pensado para quien **asiste al congreso** con rol asistente (y si la cuenta también tiene rol autor, el envío “como autor” se hace desde el **panel Autor**):

- **Enviar trabajo:** puede enviar **un trabajo** en calidad de asistente (salvo que la fecha límite de envíos ya haya pasado para nuevos envíos; igual puede ver **reenvíos** permitidos).
- **Mis trabajos (asistente):** seguimiento de **estado** (precheck, evaluación, etc.) y **reenvío** cuando el flujo lo permite.
- **Proponer taller:** envía una **propuesta de taller** para que el comité / flujo la evalúe.
- **Mi agenda:** ve **`/MiAgenda`**, actividades que sumó a su cronograma personal.
- **Certificado de asistencia:** enlace hacia la vista de **certificado** según reglas del sistema.

#### Autor/a (`/mis-presentaciones`)

- **Envío de trabajos:** puede **iniciar nuevos envíos** y gestionar los que están en **evaluación** (con **precheck** y **revisiones** con límites de intentos según estado); cuando hay **fecha límite** de envíos, los **nuevos** envíos pueden bloquearse, manteniéndose a veces **reenvíos** por observaciones.
- **Mis trabajos en proceso:** lista con **estados** (enviado, precheck, asignado, en revisión, pendiente del comité, aprobado, rechazado con posibilidad de reenvío o rechazo final, etc.).
- **Presentaciones programadas:** si el administrador ya ubicó trabajos en **mesas temáticas** o **sesiones de pósters**, aquí aparecen **fecha, horario, sala y panel** (stand) de cada presentación aprobada y colocada en programa.
- **Certificado de presentación:** acceso para **generar/descargar** el certificado de quien presenta (según disponibilidad configurada).

#### Evaluador/a (`/evaluador`)

- **Asignaciones:** ve trabajos en los que fue **asignado** como evaluador del eje correspondiente; puede **aceptar o declinar** la invitación a evaluar cuando aplique.
- **Evaluación:** para cada trabajo, emite **aprobación o rechazo**, con **comentarios** opcionales; el sistema combina las evaluaciones (por ejemplo, dos favorables pueden pasar el caso a **confirmación del comité**; rechazos disparan posibles reenvíos o **rechazo final** según intentos).
- **Propuestas de taller:** puede revisar propuestas de taller **pendientes** (flujo de aprobación vinculado al panel).

#### Otros lugares útiles en cualquier rol (según permisos)

**Inscripción** (`/inscripcion`), **envío detallado de trabajos** (`/envio-trabajos`), **programa** (`/ProgramaCongreso`, `/programa-detallado`), **dashboard** (`/dashboard`), **perfil** (`/perfil`), **notificaciones** (`/notificaciones`), **certificados** (`/certificado`).

### 5. Datos de demostración

Toda la información de usuarios, inscripciones y estados que se prueba en el navegador se guarda en **`localStorage`** de ese mismo navegador: no hay base de datos en servidor en este proyecto. Por eso los mismos pasos pueden repetirse en otra máquina o en ventana privada y el estado “empieza de cero”.

---

## Estructura breve del proyecto

- **`src/`** — código fuente React (páginas, contexto de autenticación, constantes).
- **`index.html`** — punto de entrada HTML.
- **`vite.config.ts`** — configuración de Vite.
- **`dist/`** — salida del comando `npm run build` (se genera al compilar).

---

## Problemas frecuentes

| Problema | Qué hacer |
|----------|-----------|
| No aparece la carpeta `node_modules` o `npm run dev` falla al inicio | Ejecutar **`npm install`** en la raíz del proyecto (sección 2) y volver a intentar. |
| `npm: command not found` | Instalar Node.js desde [nodejs.org](https://nodejs.org/) y cerrar/abrir la terminal. |
| `EACCES` / errores de permisos al instalar | En entornos compartidos, evitar `sudo npm install`; preferir NVM o una instalación local de Node. |
| La página no carga o queda en blanco | Consola del navegador (F12 → Consola); asegurarse de usar la URL que imprime `npm run dev`. |
| Puerto en uso | Aceptar el puerto alterno que sugiera Vite o cerrar la otra app que use el mismo puerto. |

---

Para **evaluar visualmente**, basta con: descomprimir el **ZIP** → **Node 18+** → **`npm install`** → **`npm run dev`** → abrir la URL que muestre la terminal → iniciar sesión con los usuarios de prueba que aparecen en pantalla y contraseña **`12345678`**.
