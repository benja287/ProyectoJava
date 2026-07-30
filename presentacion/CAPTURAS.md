# Capturas a colocar en la presentación

La guía de la cátedra pide **mostrar las producciones propias con capturas**, una o dos
imágenes representativas por etapa, en lugar de describirlas verbalmente.

El deck ya tiene 7 huecos marcados con borde punteado. Para llenar cada uno:

1. Sacar la captura y guardarla en `presentacion/img/` con el nombre indicado.
2. En `index.html`, buscar el bloque `<div class="shot">` correspondiente y reemplazarlo por:

```html
<img src="img/e1-maqueta.png" alt="Bocetado e historias de usuario">
```

Dejando el `<figure>` y el `<figcaption>` como están.

---

| # | Archivo | Qué capturar | Dónde conseguirla |
|---|---------|--------------|-------------------|
| 1 | `img/e1/*.png` | Ya incluidas: registro, inscripción, admin valida, envío, evaluador, programa (extraídas de `archivo_maquetado.pdf`) | Entrega 1 |
| 2 | `img/e2/hi-full.png` | Diagrama de clases completo (alta resolución). En el HTML: zoom interactivo. En el PDF: página completa; acercar con el zoom del lector | Ya incluido (render 450 DPI del PDF de clases) |
| 3 | `img/e3-persistencia.png` | Fuente de la evidencia. En la diapositiva E3 · 7/7 el resultado se muestra como texto grande (misma salida del servlet) para que se lea en proyector | `https://grupo1.jyaa-ci.linti.unlp.edu.ar/test-persistencia` |
| 4 | `img/e4-swagger.png` + `img/e4-swagger-login.png` | **Incluidas (capturas reales).** Tag Usuarios expandido + tag Login en `/swagger-ui/` | `https://grupo1.jyaa-ci.linti.unlp.edu.ar/swagger-ui/` |
| 5 | `img/e5-angular.png` | Un panel de la SPA con DevTools → Network mostrando la llamada `/api/...` y el header `Authorization` | La app corriendo + F12 |
| 6 | `img/e6-produccion.png` | La home pública o el programa del congreso con el mapa de aulas | `https://grupo1.jyaa-ci.linti.unlp.edu.ar/` |
| 7 | `img/ci-pipeline.png` | Los cuatro jobs del pipeline en verde | GitLab de la cátedra → CI/CD → Pipelines |

Además, opcional pero muy recomendable:

| Archivo | Qué es |
|---------|--------|
| `img/demo-respaldo.mp4` | Video del recorrido completo de la demo (4 min), como plan B si falla la red |

---

## Consejos para que las capturas se vean bien

- **Ventana del navegador a 1600×900** o similar (misma proporción que las diapositivas).
- **Zoom del navegador al 110–125 %** antes de capturar: en un proyector, el texto al 100 % no se lee.
- Recortar lo que no aporta (barra de marcadores, pestañas de más, el escritorio).
- Para el diagrama de clases: **no meter el diagrama completo**. La cátedra pide
  explícitamente *"el fragmento más relevante que muestre la complejidad de las relaciones"*.
- Fondo claro en todo, para que combine con el diseño del deck y se vea con proyector.

---

## Exportar el deck a PDF

Abrir `index.html` en Chrome o Edge → `Ctrl+P`:

- Destino: **Guardar como PDF**
- Orientación: **Horizontal**
- Márgenes: **Ninguno**
- Activar **Gráficos de fondo**

El archivo generado en el repo es `JYAA-Grupo1-Presentacion-TF.pdf` (~29 páginas).

**Diagrama de clases:** en el navegador el zoom es interactivo (rueda / arrastrar).
En el PDF esa página lleva la imagen hi-res a pantalla completa: para leer clases y
relaciones, acercá esa página con el zoom del lector de PDF (no hace falta tocar el HTML).
