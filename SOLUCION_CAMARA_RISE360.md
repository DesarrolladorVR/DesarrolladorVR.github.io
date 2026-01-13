# Solución: Acceso a Cámara en Rise 360

## Problema
El iframe embebido en Rise 360 bloquea el acceso a la cámara por restricciones de seguridad del navegador.

Error: `DOMException: The request is not allowed by the user agent or the platform in the current context`

---

## Soluciones Disponibles

### ✅ Opción 1: RECOMENDADA - Cambiar iframe por Botón de Enlace Externo

En Rise 360, **reemplaza el iframe con un botón** que abra la página en nueva ventana:

1. **Elimina el iframe actual:**
   ```html
   <iframe src="https://desarrolladorvr.github.io" width="100%" height="1080" frameborder="0" scrolling="yes" allow="camera"></iframe>
   ```

2. **Agrega un Botón (en Rise 360):**
   - Bloque: **Botón**
   - Texto del botón: "Abrir Entrenador de Poses"
   - URL: `https://desarrolladorvr.github.io`
   - ✅ **Marcar**: "Abrir en nueva ventana"

**Ventajas:**
- ✅ Funciona perfectamente sin restricciones
- ✅ Los estudiantes acceden a la página directamente
- ✅ Sin problemas de seguridad

---

### ⚠️ Opción 2: Mantener iframe (Requiere permisos adicionales)

Si DEBES mantener el iframe, actualízalo con estos atributos:

```html
<iframe 
  src="https://desarrolladorvr.github.io" 
  width="100%" 
  height="1080" 
  frameborder="0" 
  scrolling="yes"
  allow="camera *; microphone *; geolocation *"
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-pointer-lock">
</iframe>
```

**Importante:**
- Usa `camera *` en lugar de solo `camera`
- Incluye `allow-pointer-lock` para MediaPipe
- El navegador podría seguir bloqueando según su configuración de seguridad

---

### ⚙️ Opción 3: Verificación Técnica

He agregado mejoras al código para detectar automáticamente si estás en iframe:

1. **Meta tag agregado** en index.html:
   ```html
   <meta http-equiv="Permissions-Policy" content="camera=*, microphone=*">
   ```

2. **Script mejorado** en script.js:
   - Intenta acceder a cámara incluso en iframe
   - Si funciona: perfecto
   - Si falla: ofrece opción de "Abrir en Nueva Ventana"

3. **Headers HTTP** (_headers):
   ```
   Permissions-Policy: camera=*, microphone=*, geolocation=*
   ```

---

## Pasos para Implementar

### Paso 1: Actualizar el Código (YA HECHO ✓)
- ✅ `index.html`: Agregado meta tag de Permissions-Policy
- ✅ `script.js`: Mejorado manejo de errores e intento en iframe
- ✅ `_headers`: Agregado para servidores que lo soportan

### Paso 2: Push a GitHub
```bash
cd c:\Users\Carlos.Ortiz\Documents\GitHub\DesarrolladorVR.github.io
git add .
git commit -m "Mejora: Soporte para acceso a cámara en iframe de Rise 360"
git push origin main
```

### Paso 3: Actualizar Rise 360
**OPCIÓN A - RECOMENDADA (Cambiar a botón):**
1. Abre el curso en Rise 360
2. Busca donde está el iframe
3. Elimínalo
4. Agrega un **Bloque > Botón**
5. URL: `https://desarrolladorvr.github.io`
6. Marca: ✅ "Abrir en nueva ventana"

**OPCIÓN B - Si DEBES mantener iframe:**
1. Edita el código del iframe
2. Agrega: `allow="camera *; microphone *"` y `sandbox="allow-same-origin allow-scripts allow-forms allow-presentation"`
3. Guarda cambios

---

## Comportamiento Esperado Después

### En Nueva Ventana (FUNCIONA ✓)
- Se muestra el botón "Activar Cámara" normal
- Al hacer clic, pide permiso de cámara
- La cámara funciona correctamente
- Detecta poses con MediaPipe

### En iframe (Intenta, pero si falla)
- Se intenta acceder a la cámara
- Si el iframe tiene permisos: **FUNCIONA ✓**
- Si el iframe NO tiene permisos: muestra "Abrir en Nueva Ventana"

---

## Archivos Modificados

1. **index.html**
   - Agregado: `<meta http-equiv="Permissions-Policy" ...>`

2. **script.js**
   - Modificado: Lógica de iframe (intenta acceso primero)
   - Mejorado: Mensajes de error específicos para iframe

3. **_headers** (NUEVO)
   - Headers HTTP para Permissions-Policy

---

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| "Permiso denegado" | Usuario rechazó acceso | Haz clic en ícono 🎥 en barra y permite |
| "Cámara no encontrada" | Hardware no disponible | Verifica que cámara esté conectada |
| "Cámara en uso" | Otra app la usa | Cierra Zoom, Teams, otras pestañas |
| "Error de seguridad" | iframe sin permisos | Usa Opción 1 o 2 arriba |

---

## Contacto / Soporte

Si tienes dudas sobre Rise 360, consulta:
- Documentación de Rise: https://articulate.com/support/article/rise-shared-settings
- Tu administrador de Articulate

Para código JavaScript: revisa la consola de desarrollador (F12)
