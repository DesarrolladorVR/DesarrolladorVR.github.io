# 🔒 Soluciones para Usar con Rise/Articulate

## ⚠️ El Problema

Cuando intentas usar esta aplicación dentro de Rise (o cualquier plataforma LMS), el navegador **bloquea el acceso a la cámara** por razones de seguridad.

### ¿Por qué sucede esto?

Los navegadores modernos **solo permiten acceso a la cámara** en contextos seguros:
- ✅ HTTPS (https://)
- ✅ Localhost (http://localhost)
- ✅ Archivos locales (file://)

Rise típicamente:
- ❌ Carga contenido en un iframe
- ❌ Puede usar HTTP (no HTTPS)
- ❌ Es un contexto inseguro para la API de cámara

---

## ✅ Soluciones Recomendadas

### Solución 1: Usar GitHub Pages (RECOMENDADO) 🌟

**Esta es la mejor solución para Rise.**

#### Paso 1: Subir a GitHub Pages
```bash
# Si aún no lo has hecho
git add .
git commit -m "Actualizar proyecto con manejo de errores"
git push origin main

# Ir a Settings > Pages
# Seleccionar: Branch: main, Folder: / (root)
# Guardar
```

#### Paso 2: Obtener la URL
Tu proyecto estará disponible en:
```
https://TU-USUARIO.github.io
```

#### Paso 3: Integrar en Rise

**Opción A: Enlace Externo (Más Simple)**
1. En Rise, agrega un bloque de "Botón"
2. Texto del botón: "Abrir Entrenador Virtual de Levantamiento"
3. Enlace: `https://TU-USUARIO.github.io`
4. Marcar: "Abrir en nueva ventana" ✅

**Ventajas:**
- ✅ Funciona al 100%
- ✅ HTTPS garantizado
- ✅ Sin problemas de iframe
- ✅ Fácil de actualizar

**Opción B: Iframe con URL Externa**
1. En Rise, agrega un bloque de "Código Embebido"
2. Inserta este código:

```html
<div style="text-align: center; padding: 20px;">
  <p style="background: #FFD700; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
    ⚠️ <strong>Para usar la cámara, haz clic en el botón para abrir en nueva ventana</strong>
  </p>
  <a href="https://TU-USUARIO.github.io" 
     target="_blank" 
     style="display: inline-block; background: #4A3168; color: white; padding: 15px 30px; 
            border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 18px;">
    📷 Abrir Entrenador Virtual
  </a>
</div>
```

---

### Solución 2: Descargar y Usar Localmente 💻

**Para presentaciones o uso individual.**

#### Instrucciones para Estudiantes:

1. **Descargar el archivo .zip**
   - Proporciona el .zip del proyecto
   - O descarga desde GitHub: Code > Download ZIP

2. **Descomprimir**
   - Extraer en una carpeta (Ej: `Escritorio/EntrenadorVirtual`)

3. **Abrir el archivo**
   - Doble clic en `index.html`
   - Se abrirá en el navegador predeterminado

4. **Permitir acceso a la cámara**
   - El navegador pedirá permiso
   - Clic en "Permitir"

**Ventajas:**
- ✅ Funciona sin internet
- ✅ Control total
- ✅ Sin restricciones

**Desventajas:**
- ❌ Cada estudiante debe descargar
- ❌ No integrado en Rise

---

### Solución 3: Servidor HTTPS Propio 🌐

**Para instituciones con infraestructura propia.**

#### Requisitos:
- Servidor web con HTTPS
- Dominio propio

#### Pasos:
1. Subir archivos al servidor HTTPS
2. Configurar correctamente los permisos CORS
3. Usar la URL en Rise

**Ejemplo:**
```
https://educacion.tu-institucion.edu/entrenador-virtual/
```

---

### Solución 4: Modo Demostración (Sin Cámara) 🎥

**Para cuando la cámara no es posible.**

Puedes grabar videos demostrativos:

1. **Video de técnica correcta:**
   - Graba usando la aplicación localmente
   - Exporta el video
   - Súbelo a Rise

2. **Video de técnica incorrecta:**
   - Muestra los errores comunes
   - Sube a Rise

3. **Screenshots con métricas:**
   - Captura pantallas con scores
   - Usa en Rise como material visual

---

## 📝 Plantilla para Instrucciones en Rise

Puedes copiar y pegar esto en un bloque de texto de Rise:

```markdown
# 📦 Entrenador Virtual de Levantamiento Seguro

## ⚠️ Importante sobre el Acceso a la Cámara

Por razones de seguridad del navegador, esta aplicación **debe usarse fuera de Rise**.

### Cómo Usar:

1. Haz clic en el botón debajo
2. Se abrirá en una nueva ventana
3. Permite el acceso a la cámara cuando te lo pida
4. ¡Practica tu técnica!

[BOTÓN: Abrir Entrenador Virtual]

### ¿Problemas?

- **El navegador no pide acceso:** Verifica que tu navegador tenga permisos
- **No funciona:** Descarga el archivo .zip y abre localmente
- **Sin cámara:** Usa los videos demostrativos en la siguiente lección

### Alternativa sin Internet:

Descarga el proyecto completo:
[BOTÓN: Descargar .zip]

Descomprime y abre `index.html` en tu navegador.
```

---

## 🔧 Configuración Técnica para Rise

### Permitir Popups

Algunos navegadores bloquean popups. Instrucciones para estudiantes:

**Chrome:**
1. Clic en el ícono de bloqueo 🔒 en la barra de direcciones
2. Permitir ventanas emergentes
3. Recargar la página

**Firefox:**
1. Buscar el ícono de bloqueo
2. Desbloquear ventanas emergentes

**Edge:**
Similar a Chrome

---

## 📊 Comparación de Soluciones

| Solución | Facilidad | Costo | Funcionalidad | Recomendado |
|----------|-----------|-------|---------------|-------------|
| GitHub Pages + Enlace | ⭐⭐⭐⭐⭐ | Gratis | 100% | ✅ SÍ |
| Descargar Local | ⭐⭐⭐⭐ | Gratis | 100% | ⭐ |
| Servidor Propio | ⭐⭐ | $$$ | 100% | Solo instituciones |
| Videos Demo | ⭐⭐⭐⭐⭐ | Gratis | 50% | Como complemento |

---

## 🎯 Implementación Paso a Paso en Rise

### Configuración Recomendada:

#### Lección 1: Introducción Teórica
- Texto con conceptos
- Imágenes de posturas
- Quiz de conocimientos

#### Lección 2: Entrenador Virtual (Esta)
**Bloque 1:** Texto explicativo
```
En esta actividad usarás un Entrenador Virtual con IA 
que analiza tu postura en tiempo real.
```

**Bloque 2:** Botón de Enlace Externo
- Texto: "🚀 Abrir Entrenador Virtual"
- URL: `https://TU-USUARIO.github.io`
- Abrir en nueva ventana: ✅

**Bloque 3:** Instrucciones
```
Instrucciones:
1. Haz clic en el botón
2. Permite acceso a la cámara
3. Activa el entrenador con el toggle
4. Practica hasta lograr 100%
5. Regresa aquí para continuar
```

**Bloque 4:** Quiz de Verificación
- "¿Lograste alcanzar 100% de score?"
- "¿Qué criterio fue más difícil de cumplir?"

#### Lección 3: Evaluación Práctica
- Video del estudiante demostrando
- O autoevaluación con capturas

---

## 🆘 Troubleshooting

### Problema: "No puedo ver el botón de enlace externo"
**Solución:** Asegúrate de que Rise permita enlaces externos. Verifica la configuración del curso.

### Problema: "GitHub Pages no está activo"
**Solución:**
1. Ve a Settings del repositorio
2. Pages > Source > main > Save
3. Espera 2-3 minutos
4. Prueba la URL

### Problema: "Estudiantes reportan que no funciona"
**Solución:**
1. Verifica que usen Chrome/Firefox/Edge actualizado
2. Confirma que acepten permisos de cámara
3. Proporciona alternativa de descarga local

### Problema: "Error CORS de DataDog"
**Solución:** Este error es irrelevante para tu aplicación. Es de un servicio externo y no afecta el funcionamiento. Ignóralo.

---

## 💡 Best Practices

### Para Instructores:

1. **Prueba primero:** Abre la URL en incógnito para verificar
2. **Instrucciones claras:** Proporciona pasos detallados
3. **Video demo:** Graba un video de cómo usar la app
4. **Alternativa siempre:** Ten el .zip disponible para descargar

### Para Estudiantes:

1. **Navegador actualizado:** Usa la última versión
2. **Permisos:** Acepta cuando pida acceso a cámara
3. **Buena luz:** Practica con buena iluminación
4. **Privacidad:** Todo se procesa localmente, nada se graba

---

## 📞 Soporte

### Recursos Adicionales:

- **GitHub Pages Docs:** https://pages.github.com/
- **Rise 360 Help:** https://help.articulate.com/rise
- **MediaPipe Docs:** https://mediapipe.dev/

### Contacto:
Si los estudiantes tienen problemas técnicos, proporciona:
- Email de soporte técnico
- Horario de consultas
- Guía de troubleshooting en PDF

---

## ✅ Checklist de Implementación

Antes de publicar en Rise:

- [ ] GitHub Pages está activo
- [ ] URL de GitHub funciona en incógnito
- [ ] Botón de enlace externo configurado en Rise
- [ ] Instrucciones claras para estudiantes
- [ ] Alternativa de descarga disponible
- [ ] Video demo grabado (opcional)
- [ ] Quiz de seguimiento creado
- [ ] Probado en Chrome, Firefox y Edge
- [ ] Probado en Windows y Mac
- [ ] Plan B listo (videos/capturas)

---

**🎓 ¡Listo para usar en tu curso de Rise!**

*Recuerda: La mejor opción es usar GitHub Pages con enlace externo. Es gratis, fácil y funciona al 100%.*
