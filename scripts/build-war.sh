#!/usr/bin/env bash
# Build completo: Angular (frontend) + empaquetado WAR (backend).
# Usar ESTE script en lugar de solo "mvn package" en backend/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEBAPP="$ROOT/backend/src/main/webapp"

echo "==> 1/4 Build Angular (producción)"
cd "$ROOT/frontend"
npm ci
npm run build

echo "==> 2/4 Copiar dist → backend/src/main/webapp (sin borrar WEB-INF ni swagger-ui)"
# Solo reemplazamos artefactos de la SPA; conservamos WEB-INF y swagger-ui del backend.
find "$WEBAPP" -mindepth 1 -maxdepth 1 \
  ! -name 'WEB-INF' ! -name 'swagger-ui' \
  -exec rm -rf {} +
cp -r "$ROOT/frontend/dist/jyaa-frontend/browser/"* "$WEBAPP/"

echo "==> 3/4 mvn clean package"
cd "$ROOT/backend"
mvn clean package -q

echo "==> 4/4 Verificación rápida del WAR"
WAR="$ROOT/backend/target/jyaa2026-grupo1.war"
if ! unzip -l "$WAR" | grep -q 'main-.*\.js'; then
  echo "ERROR: el WAR no contiene main-*.js (falta el frontend Angular)." >&2
  exit 1
fi
if ! unzip -l "$WAR" | grep -q 'version.json'; then
  echo "ERROR: el WAR no contiene version.json." >&2
  exit 1
fi
if unzip -p "$WAR" index.html | grep -q 'app-root'; then
  echo "OK: index.html es la SPA Angular (<app-root>)"
else
  echo "ERROR: index.html NO es la SPA (¿quedó el HTML viejo del backend?)." >&2
  exit 1
fi
if unzip -p "$WAR" styles-*.css 2>/dev/null | grep -q 'panel-hero--admin'; then
  echo "OK: estilos del panel admin nuevo detectados (panel-hero--admin)"
else
  echo "AVISO: no se encontró panel-hero--admin en styles.css (¿bundle viejo?)." >&2
fi
MAIN="$(unzip -l "$WAR" | awk '/main-.*\.js/{print $4; exit}')"
BUILD="$(unzip -p "$WAR" version.json)"
echo "OK: WAR generado en $WAR"
echo "    Bundle: $MAIN"
echo "    version.json: $BUILD"
