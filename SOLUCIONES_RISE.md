# 🔒 Soluciones para Usar con Rise/Articulate

## ⚠️ El Problema REAL

Aunque tu aplicación esté alojada en GitHub Pages (HTTPS), **NO FUNCIONARÁ en un iframe de Rise**.

### ¿Por qué NO funciona?

Aunque uses HTTPS, los navegadores modernos **bloquean el acceso a la cámara en iframes** por razones de seguridad, a menos que el iframe tenga el atributo `allow="camera"`.

**El problema:**
- ✅ Tu página: HTTPS (GitHub Pages)
- ❌ Rise: Carga tu página en un iframe SIN `allow="camera"`
- ❌ Navegador: Bloquea el acceso con el error:
  ```
  DOMException: The request is not allowed by the user agent 
  or the platform in the current context
  ```

**Conclusión:** NO uses iframes en Rise para esta aplicación.

---

## ✅ LA SOLUCIÓN CORRECTA (100% Funcional)

## ✅ LA SOLUCIÓN CORRECTA (100% Funcional)

### Usar Botón de Enlace Externo en Rise 🌟

**Esta es la ÚNICA forma que funciona correctamente.**

#### Pasos para Implementar en Rise:

**1. Asegúrate de tener GitHub Pages activo:**
```bash
# Tu URL será:
https://TU-USUARIO.github.io
```

**2. En Rise, NO uses "Embed de Contenido" ni "Iframe"**

**3. En Rise, usa el bloque "BOTÓN":**

```
Paso a Paso:
1. Agrega un bloque de texto explicativo:
   "A continuación, accederás al Entrenador Virtual con IA..."

2. Agrega un bloque de tipo "BOTÓN"

3. Configura el botón:
   • Texto: "🚀 Abrir Entrenador Virtual de Levantamiento"
   • URL: https://desarrolladorvr.github.io (tu URL de GitHub Pages)
   • ✅ IMPORTANTE: Marca "Abrir en nueva ventana"
   • Color: Púrpura o destacado

4. Agrega texto después:
   "Después de practicar, regresa aquí para continuar..."
```

**Ventajas de este método:**
- ✅ Funciona al 100%
- ✅ Sin problemas de permisos
- ✅ Experiencia de usuario óptima
- ✅ Fácil de actualizar
- ✅ No requiere configuración técnica

**Ejemplo visual del flujo:**
```
[Texto en Rise]
↓
[BOTÓN: 🚀 Abrir Entrenador Virtual]
(abre en nueva ventana)
↓
Estudiante usa la aplicación
↓
Cierra ventana y regresa a Rise
↓
[Texto en Rise: "Continúa con..."]
```

---

## ❌ Lo Que NO Debes Hacer

### NO usar "Embed de Contenido" / Iframe

Aunque Rise te permita insertar código HTML con iframes, **NO funcionará** para esta aplicación.

**Este código NO funcionará:**
```html
<!-- ❌ NO USAR ESTO -->
<iframe src="https://tu-usuario.github.io" 
        width="100%" height="800px">
</iframe>
```

**¿Por qué no funciona?**
- Rise genera iframes sin el atributo `allow="camera"`
- Los navegadores bloquean el acceso a la cámara
- Verás el error: "The request is not allowed..."

---

## 🎯 Lo Que Verán los Estudiantes

### Si se detecta iframe (por error):

La aplicación ahora detecta automáticamente si está en un iframe y:

1. **Banner rojo en la parte superior:**
   ```
   ⚠️ ¡Importante! Estás viendo esto dentro de Rise.
   Para usar la cámara, haz clic en el botón 
   "Abrir en Nueva Ventana" abajo.
   ```

2. **El botón de cámara cambia a:**
   ```
   🚀 Abrir en Nueva Ventana
   ```

3. **Modal explicativo:**
   - Explica el problema
   - Proporciona solución
   - Da instrucciones al instructor

**Esto significa que aunque uses iframe por error, los estudiantes sabrán qué hacer.**

---

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
