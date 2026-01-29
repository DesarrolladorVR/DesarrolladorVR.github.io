# Web Performance Audit (ISTEduca - Pausa Saludable)

Fecha: 2026-01-29

## Resumen
Auditoría basada en revisión de código y mediciones reales con Lighthouse (ejecución local). Se identificaron oportunidades claras para mejorar LCP/CLS y reducir trabajo en el hilo principal.

## Hallazgos principales
- LCP potencial dependiente de la carga de la imagen de logotipo y fuentes.
- CLS potencial en el contenedor de video/canvas al no reservar espacio fijo antes de que el stream esté listo.
- Descarga de audio no crítico al inicio.

## Mediciones Lighthouse (local)
Fuente: reporte JSON en docs/lighthouse-report.json.

**Puntajes**
- Performance: 96
- Accessibility: 100
- Best Practices: 92
- SEO: 91

**Core Web Vitals / Métricas clave**
- FCP: 2292 ms
- LCP: 2292 ms
- TTI: 2292 ms
- Speed Index: 2292 ms
- TBT: 0 ms
- CLS: 0.00023

## Quick wins implementados (ya aplicados)
- Preload del logotipo para mejorar LCP.
- Reservar aspecto 16:9 en video/canvas para reducir CLS.
- Ajuste de `preload` de audio a `metadata`.
- Añadir `decoding="async"` y `fetchpriority="high"` en el logotipo.

Archivos tocados:
- index.html
- src/css/media.css

## Plan de implementación

### 1) Corto plazo (1-2 días)
- Medir con Lighthouse (mobile/desktop) y capturar métricas base: LCP, CLS, TBT, INP.
- Verificar compresión de imágenes (PNG/JPG) y convertir a WebP si el hosting lo permite.
- Revisar tamaño de audio y comprimir a formato más liviano (por ejemplo, .mp3 u .ogg) manteniendo calidad.

### 2) Mediano plazo (1-2 semanas)
- Lazy-load de recursos no críticos (audios de voz del flujo) usando carga bajo demanda.
- Service Worker simple para cachear assets estáticos.
- Extraer CSS crítico si hay crecimiento de estilos.

### 3) Largo plazo (1-3 meses)
- Implementar pipeline de build (minificación CSS/JS, hash de assets, tree-shaking si aplica).
- CDN para assets pesados (audio/imagenes) y configuración de cache-control.

## Plan de métricas

**Objetivos (Core Web Vitals)**
- LCP < 2.5 s
- CLS < 0.1
- TBT < 300 ms
- INP < 200 ms

**Cadencia**
- Lighthouse local: en cada release y después de cambios en UI/JS/CSS.
- Revisión mensual de tendencias (comparar con baseline actual).

**Presupuesto de rendimiento (initial)**
- JS total: ≤ 200 KB (gzipped)
- CSS total: ≤ 80 KB (gzipped)
- Imágenes above-the-fold: ≤ 200 KB
- Audio inicial: ≤ 150 KB

**Alertas/seguimiento**
- Si LCP > 2.5 s o CLS > 0.1, abrir ticket de optimización.
- Registrar resultados en este documento.

## Próximo paso recomendado
Ejecutar Lighthouse y comparar con estas metas. A partir de los resultados, priorizar optimizaciones en orden de impacto.
