# Deploy Entrega 5 — enfoque híbrido (recomendado)

## Resumen

| Entorno | Frontend | API | CORS |
|---------|----------|-----|------|
| **Desarrollo** | `localhost:4200` | `grupo1.../api` (vía proxy o directo) | Solo si llamás sin proxy |
| **Producción** | `grupo1.../` | `grupo1.../api` | No (mismo host) |

Un solo `git push gitlab main` → Docker empaqueta **Angular + API** en el mismo WAR.

---

## Desarrollo local

### Modo fácil (proxy, sin CORS)

```bash
cd frontend && npm start
```

- `environment.ts` → `apiUrl: '/api'`
- `proxy.conf.json` reenvía a grupo1

### Modo CORS (para demostrar al profesor)

```bash
npm run start:cors
```

Usa `environment.cors.ts` (URL absoluta de grupo1) y **sin proxy**. No hay que editar `environment.ts`.

Requisito: el backend con filtros CORS deployado en grupo1 (`git push gitlab main`).

---

## Producción (GitLab)

```bash
git push gitlab main
```

Pipeline verde → abrir:

- App: `https://grupo1.jyaa-ci.linti.unlp.edu.ar/`
- API: `https://grupo1.jyaa-ci.linti.unlp.edu.ar/api/health`
- Swagger: `https://grupo1.jyaa-ci.linti.unlp.edu.ar/swagger-ui/`

No hace falta Netlify ni variables CORS en GitLab.

---

## Archivos clave

- `Dockerfile` — build Angular + WAR
- `environment.prod.ts` — `apiUrl: '/api'`
- `CorsConfig.java` — permite `http://localhost:4200` en dev
- `web.xml` — `/api/*` → Jersey; resto → estáticos Angular
