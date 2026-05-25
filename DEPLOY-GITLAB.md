# Guía de despliegue — Grupo 1 (JYAA 2026)

## Orden correcto (qué hacer primero)

| Paso | Qué | Dónde |
|------|-----|--------|
| **A** | Tener el proyecto Java en `/backend` (ya creado) | Tu PC |
| **B** | Probar compilación local `mvn package` | Terminal |
| **C** | Subir todo al repo GitLab `jyaa2026_grupo1` en rama `main` | GitLab |
| **D** | Ver pipeline verde: Build → Pipelines | GitLab |
| **E** | Abrir https://grupo1.jyaa-ci.linti.unlp.edu.ar/ | Navegador |
| **F** | Ver tablas en phpMyAdmin (opcional) | dbadmin.jyaa-ci.linti.unlp.edu.ar |

**No empieces por GitLab vacío sin código:** primero necesitás el `backend/` con `pom.xml` y `src/`.

---

## Estructura del repositorio

```
jyaa2026_grupo1/
├── backend/
│   ├── pom.xml
│   └── src/main/...
├── frontend/          ← placeholder (React después)
├── Dockerfile
├── .gitlab-ci.yml
└── README.md
```

---

## Credenciales grupo 1

| Dato | Valor |
|------|--------|
| MySQL host | `mysql.java.linti.unlp.edu.ar` |
| Base | `jyaa2026_bd1` |
| Usuario | `jyaa2026_usr1` |
| Clave | `jyaa2026_pwd1` |
| URL sitio | https://grupo1.jyaa-ci.linti.unlp.edu.ar/ |
| Puerto Docker (VM) | **8091** → 8080 Tomcat |
| Logs Portainer | https://config.jyaa-ci.linti.unlp.edu.ar — user `grupo1_2026` / pass `grupo1_2026!` |

---

## Subir a GitLab (primera vez)

```bash
cd /home/alexis/ProyectoJava   # o la carpeta donde tengas el proyecto

# Si este folder es solo para GitLab, cloná el repo vacío y copiá archivos:
# git clone https://gitlab.catedras.linti.unlp.edu.ar/jyaa_2026/jyaa2026_grupo1.git
# cd jyaa2026_grupo1

git remote add gitlab https://gitlab.catedras.linti.unlp.edu.ar/jyaa_2026/jyaa2026_grupo1.git
# si ya tenés origin en GitHub, usá otro nombre: gitlab

git add backend/ Dockerfile .gitlab-ci.yml frontend/ DEPLOY-GITLAB.md .gitignore
git commit -m "Backend JPA grupo1 + CI/CD Docker"
git push gitlab main
```

Si GitLab ya tiene un README y rechaza el push:

```bash
git pull gitlab main --allow-unrelated-histories
# resolver conflictos si hay
git push gitlab main
```

---

## Eclipse — importar el backend

1. File → Import → Maven → Existing Maven Projects
2. Root: carpeta `backend` (no la raíz del repo React)
3. Esperar descarga de dependencias (`.m2`)
4. Click derecho → Run As → Maven build → Goals: `clean package`
5. Para Tomcat local: Dynamic Web Project o plugin Tomcat; desplegar `backend/target/jyaa2026-grupo1.war`

---

## Probar API local (Tomcat o después del deploy)

- `GET /api/health`
- `POST /api/login` body: `{"email":"mantillabenja153@gmail.com","password":"12345678"}`

---

## Qué hace el Dockerfile

1. Etapa **Maven**: copia `backend/pom.xml`, descarga deps, copia `backend/src`, ejecuta `mvn package` → genera `jyaa2026-grupo1.war`
2. Etapa **Tomcat**: copia el WAR como `ROOT.war` → la app queda en la raíz del sitio

---

## Qué hace `.gitlab-ci.yml`

| Job | Acción |
|-----|--------|
| buildDocker | `docker build` → imagen `grupo1-docker` |
| detenemosContainer | `docker stop grupo1` |
| eliminamosContainer | `docker rm grupo1` |
| deploy1 | `docker run` puerto 8091, Traefik → `grupo1.jyaa-ci...` |

Solo corre en rama **`main`**.

---

## Relación React ↔ Java

| React (frontend) | Java (backend) |
|------------------|----------------|
| `User`, roles | `Usuario`, `RolUsuario` |
| `congress_works` | `Trabajo` |
| Circulares en localStorage | `Circular` + `/api/circulares` |
| Login local | `POST /api/login` + sesión HTTP |

Próximo paso futuro: que React llame a `https://grupo1.jyaa-ci.linti.unlp.edu.ar/api/...` en lugar de localStorage.
