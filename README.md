# JYAA 2026 — Grupo 1 — Congreso Argentino de Agroecología

Repositorio del **grupo 1**: frontend React (raíz) + backend Java (persistencia JPA/Hibernate).

| Parte | Carpeta | Descripción |
|-------|---------|-------------|
| **Frontend** | `src/`, `package.json` | React + Vite (paneles por rol; demo con `localStorage`) |
| **Backend** | `backend/` | WAR Maven: Servlets, JPA, DAOs, MySQL curso |
| **Deploy** | `Dockerfile`, `.gitlab-ci.yml` | CI/CD → https://grupo1.jyaa-ci.linti.unlp.edu.ar/ |

Documentación de despliegue: [DEPLOY-GITLAB.md](DEPLOY-GITLAB.md)  
Ambiente de prueba persistencia: [backend/AMBIENTE-PRUEBA.txt](backend/AMBIENTE-PRUEBA.txt)

### Probar persistencia (servidor del curso)

Tras pipeline verde en GitLab (`main`):

- https://grupo1.jyaa-ci.linti.unlp.edu.ar/test-persistencia
- https://grupo1.jyaa-ci.linti.unlp.edu.ar/api/health

MySQL grupo 1: `jyaa2026_bd1` en `mysql.java.linti.unlp.edu.ar:3306` (ver `backend/src/main/resources/META-INF/persistence.xml`).

---

# Frontend — aplicación web React

Interfaz web del proyecto (React + Vite): paneles por rol (administración, comité académico, asistente, autor, evaluador), inscripción y flujos del congreso. Los datos de demostración del frontend se guardan en el **navegador** (`localStorage`). El **backend** en `backend/` persiste en MySQL (tercera entrega).

## Requisitos previos

| Requisito | Notas |
|-----------|--------|
| **Node.js** | Versión **18 o superior** (recomendado: [LTS actual](https://nodejs.org/)). Incluye `npm`. |
| **Git** | Opcional para clonar; también se puede usar el `.zip` del proyecto. |
| **Navegador** | Chrome, Edge o Firefox actualizado. |

Comprobar versiones en una terminal:

```bash
node -v
npm -v
```

## 1. Obtener el proyecto

1. Clonar o descomprimir el proyecto.
2. La **raíz del frontend** contiene `package.json`, `src/`, `index.html`.
3. El backend está en la subcarpeta **`backend/`** (Maven).

## 2. Instalar dependencias (frontend)

En la raíz del proyecto (donde está `package.json`):

```bash
npm install
```

## 3. Ejecutar la aplicación en modo desarrollo

```bash
npm run dev
```

Vite mostrará una URL similar a **http://localhost:5173**.

Para **detener** el servidor: `Ctrl+C`.

## 4. Compilar para producción (opcional)

```bash
npm run build
npx vite preview
```

## Cómo probar el inicio de sesión (frontend demo)

1. Abran la app (`npm run dev`) y vayan a **`/login`**.
2. Usuarios de prueba en pantalla; contraseña de demostración: **`12345678`**.

## Backend (Java)

```bash
export JAVA_HOME=/ruta/a/jdk-21-o-superior
cd backend
mvn clean package
```

Ver [backend/AMBIENTE-PRUEBA.txt](backend/AMBIENTE-PRUEBA.txt) para Eclipse, Tomcat y pruebas locales.

## Estructura del repositorio

```
├── backend/           → pom.xml, src/main/java, persistence.xml
├── frontend/          → placeholder README
├── Dockerfile
├── .gitlab-ci.yml
├── src/               → React
└── DEPLOY-GITLAB.md
```

## Problemas frecuentes (frontend)

| Problema | Qué hacer |
|----------|-----------|
| No aparece `node_modules` | Ejecutar **`npm install`** en la raíz. |
| `npm: command not found` | Instalar Node.js desde [nodejs.org](https://nodejs.org/). |
| La página queda en blanco | Consola del navegador (F12); usar la URL que imprime `npm run dev`. |

Para evaluar el frontend: **Node 18+** → **`npm install`** → **`npm run dev`** → login con usuarios de prueba y contraseña **`12345678`**.
