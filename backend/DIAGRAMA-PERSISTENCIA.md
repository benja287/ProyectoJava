# Diagrama de Clases (Entrega 2) → Persistencia JPA (Entrega 3)

Referencia: `Diagrama de Clases_Grupo01.pdf` — paquete `ar.edu.unlp.jyaa.grupo1.modelo`.

## Qué es cada cosa en JPA

| En el diagrama UML | En la entrega 3 (Java) |
|------------------|-------------------------|
| Clase con `@Entity` | Tabla en MySQL |
| Enum | Columna `VARCHAR` o tabla de valores |
| `SistemaGestionCongreso` | **No es entidad**: clase `SistemaGestionCongresoService` (lógica de negocio) |
| Relación 1-* / *-* | `@OneToMany`, `@ManyToOne`, `@ManyToMany` |
| `Map<EtapaProceso, RangoFechas>` | `@ElementCollection` de `EtapaCongreso` (embeddable) |
| UUID en el PDF | `Long` autogenerado (válido para JPA; el diagrama conceptual usa UUID) |

## Cobertura por clase del diagrama

| Clase UML | Entidad JPA | Estado |
|-----------|-------------|--------|
| Congreso | `Congreso` | ✅ |
| Usuario | `Usuario` | ✅ |
| Rol | `Rol` (enum) | ✅ |
| Trabajo | `Trabajo` | ✅ |
| TipoTrabajo | enum | ✅ |
| EstadoTrabajo | enum | ✅ |
| AsignacionEvaluacion | `AsignacionEvaluacion` | ✅ |
| Evaluacion | `Evaluacion` | ✅ |
| RecomendacionEvaluacion | enum | ✅ |
| InscripcionCongreso | `InscripcionCongreso` | ✅ |
| Pago | `Pago` | ✅ |
| EstadoInscripcion / EstadoPago / MetodoPago | enums | ✅ |
| Actividad | `Actividad` | ✅ |
| CronogramaPersonal | `CronogramaPersonal` | ✅ |
| Circular | `Circular` | ✅ |
| Notificacion | `Notificacion` | ✅ |
| CanalNotificacion | enum | ✅ |
| EnvioEmail | `EnvioEmail` | ✅ |
| PlantillaEmail | `PlantillaEmail` | ✅ |
| Anuncio | `Anuncio` | ✅ |
| Certificado | `Certificado` | ✅ |
| EtapaProceso / RangoFechas | enum + embeddable | ✅ |
| SistemaGestionCongreso | `SistemaGestionCongresoService` | ✅ (sin tabla) |

## Equivalencia con React (implementación anterior)

| React (localStorage) | Modelo UML / JPA |
|----------------------|------------------|
| `congress_users` | `Usuario` + `InscripcionCongreso` + `Pago` |
| `congress_works` | `Trabajo` + `AsignacionEvaluacion` + `Evaluacion` |
| `congress_sessions` / `roundtables` / `posters` | `Actividad` (tipo MESA_TEMATICA, MESA_REDONDA, POSTER) |
| `congress_talleres_*` / `conferencias` | `Actividad` (TALLER, CONFERENCIA) |
| `congress_circulares` | `Circular` |
| notificaciones en AuthContext | `Notificacion` |
| email log | `EnvioEmail` + `PlantillaEmail` |
| certificados | `Certificado` |
| `congress_agendas` | `CronogramaPersonal` |

## DAO + ABM (tercera entrega)

Cada entidad tiene `XxxDAO` + `XxxDAOImpl` extendiendo `AbstractJpaDAO` con:

- `alta`, `baja`, `modificar`, `recuperarPorId`, `listarTodos`

Casos de prueba: servlet **`/test-persistencia`** → clase `PersistenciaAbmTests`.

Ambiente: ver **`AMBIENTE-PRUEBA.txt`**.
