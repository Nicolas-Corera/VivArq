# VivArq 🏗️

**Plataforma digital que conecta profesionales de la construcción con clientes en Argentina**

![VivArq Logo](images/Logo.png)

---

## 📋 Descripción

VivArq es una plataforma web integral diseñada para revolucionar la forma en que profesionales de la construcción y clientes se conectan en Argentina. La aplicación facilita la búsqueda, contratación y gestión de proyectos de construcción, proporcionando herramientas avanzadas para ambas partes del proceso.

### 🎯 Objetivo

Simplificar y digitalizar el proceso de contratación en el sector de la construcción, ofreciendo una plataforma segura, intuitiva y completa para profesionales y clientes.

---

## ✨ Características Principales

### Para Clientes (Contratistas)
- 🔍 **Búsqueda de Profesionales**: Filtros avanzados por especialidad (Arquitectos, Ingenieros, Constructores, Electricistas, Plomeros, Gasistas, etc.)
- 📝 **Publicación de Proyectos**: Sistema paso a paso para crear proyectos detallados
- 💬 **Chat Integrado**: Comunicación directa con profesionales
- 📊 **Gestión de Proyectos**: Panel de control para seguimiento de múltiples proyectos
- 🧾 **Generador de Contratos**: Creación automática de contratos personalizados

### Para Profesionales
- 👤 **Perfil Profesional Completo**: Portafolio, especialidades, experiencia y certificaciones
- 🔔 **Sistema de Notificaciones**: Alertas de nuevos proyectos relevantes
- 💼 **Búsqueda de Proyectos**: Acceso a oportunidades laborales según especialidad
- 📁 **Gestión de Folios**: Organización de documentación y proyectos
- 💰 **Calculadora de Impuestos**: Herramienta especializada para cálculos fiscales y presupuestos

### Funcionalidades Generales
- 🔐 **Sistema de Autenticación Seguro**: Login/Registro con Firebase Authentication
- 💬 **Sistema de Mensajería en Tiempo Real**: Chat instantáneo entre usuarios
- 📱 **Diseño Responsivo**: Optimizado para dispositivos móviles, tablets y desktop
- 🎨 **Interfaz Moderna**: UI/UX intuitiva y atractiva
- 📊 **Dashboard Personalizado**: Panel de control según tipo de usuario
- ⚙️ **Configuración de Cuenta**: Gestión completa de perfil y preferencias

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica y accesible
- **CSS3**: Estilos modernos con animaciones y transiciones
- **JavaScript (ES6+)**: Lógica del cliente con módulos ES6
- **Font Awesome 6.2.0**: Iconografía

### Backend & Base de Datos
- **Firebase**:
  - Firebase Authentication (autenticación de usuarios)
  - Cloud Firestore (base de datos NoSQL en tiempo real)
  - Firebase Storage (almacenamiento de imágenes y archivos)

### Arquitectura
- **SPA (Single Page Application)**: Navegación fluida sin recargas
- **Modular**: Código organizado en módulos reutilizables
- **Responsive Design**: Mobile-first approach

---

## 📁 Estructura del Proyecto

```
vivarq/
│
├── index.html                      # Página principal
├── login.html                      # Inicio de sesión y registro
├── resetPassword.html              # Formulario de recuperación de contraseña
├── newPassword.html                # Establecer nueva contraseña
├── allProjects.html                # Listado general de todos los proyectos
├── allProfessionals.html           # Listado general de profesionales
├── project-form.html               # Formulario para crear proyectos
├── edit-project.html               # Edición de un proyecto ya creado
├── project-detail.html             # Detalle de un proyecto específico
├── profile-professional.html       # Perfil del profesional
├── profile-contractor.html         # Perfil del contratista/cliente
├── chat.html                       # Sistema de mensajería
├── config.html                     # Configuración de cuenta
├── tax-calculator.html             # Calculadora de impuestos
├── contract-generator.html         # Generador de contratos automáticos
├── contactUs.html                  # Página de contacto
├── faq.html                        # Preguntas frecuentes
├── terms&conditions.html           # Términos y condiciones
├── privacity.html                  # Políticas de privacidad
│
├── css/                            # Estilos CSS
│   ├── styles.css                  # Estilos globales de la plataforma
│   ├── home.css                    # Estilos de la página principal
│   ├── login.css                   # Estilos de login y registro
│   ├── profile.css                 # Estilos de los perfiles
│   ├── chat.css                    # Estilos del chat
│   ├── project-form.css            # Estilos del formulario de crear proyecto
│   ├── project-details.css         # Estilos de detalles de proyecto
│   ├── tax-calculator.css          # Estilos de la calculadora de impuestos
│   ├── allProjects.css             # Estilos de listado de proyectos
│   ├── allProfessionals.css        # Estilos de listado de profesionales
│   ├── config-styles.css           # Estilos de la sección Configuración
│   ├── contactUs.css               # Estilos del formulario de contacto
│   ├── contract.css                # Estilos del generador de contratos
│   ├── faq.css                     # Estilos de la sección FAQ
│   ├── folios.css                  # Estilos de gestión de folios/documentos
│   ├── legal-styles.css            # Estilos de secciones legales
│   ├── newPassword.css             # Estilos de nueva contraseña
│   ├── resetPassword.css           # Estilos de recuperación de contraseña
│   ├── taxs.css                    # Estilos de impuestos adicionales
│   └── terms&conditions.css        # Estilos de términos y condiciones
│
├── js/                             # Scripts JavaScript
│   ├── firebase-config.js          # Configuración y conexión Firebase
│   ├── auth.js                     # Registro, login y logout
│   ├── home.js                     # Lógica interactiva de la página principal
│   ├── chat.js                     # Sistema completo de chat
│   ├── projects.js                 # Gestión general de proyectos
│   ├── project-detail.js           # Visualización de un proyecto específico
│   ├── projectNotification.js      # Notificaciones relacionadas a proyectos
│   ├── projects&professionals.js   # Filtros y lógica compartida
│   ├── profileProfessional.js      # Funciones del perfil profesional
│   ├── profileContratist.js        # Funciones del perfil del contratista
│   ├── tax-calculator.js           # Lógica de la calculadora de impuestos
│   ├── taxs.js                     # Funciones adicional de cálculos fiscales
│   ├── resetPassword.js            # Recuperación de contraseña
│   ├── newPassword.js              # Establecimiento de nueva contraseña
│   ├── contactUs.js                # Envío del formulario de contacto
│   ├── faq.js                      # Preguntas frecuentes dinámicas
│   ├── folios.js                   # Gestión de folios/documentación
│   ├── configPage.js               # Configuración de usuario
│   ├── displayMessage.js           # Renderizado de mensajes en el chat
│   ├── exposure-examples.js        # Ejemplos visuales/educativos
│   ├── exposure-system.js          # Sistema de exposición/documentación
│   ├── index.js                    # Control inicial y landing
│   ├── integration.js              # Integraciones externas / módulos
│   ├── layout.js                   # Control del layout general
│   ├── loadPages.js                # Sistema SPA para cargar páginas dinámicamente
│   ├── organizarApp.js             # Organización general de la app
│   ├── process-section.js          # Procesos de pasos / secciones
│   ├── edit-project.js             # Edición de proyectos
│   └── unread-messages-tracker.js  # Seguimiento de mensajes no leídos
│
└── images/                         # Recursos gráficos
    ├── Logo.png                    # Logo principal
    ├── Logo Black.png              # Logo alternativo
    ├── default-profile.png         # Avatar predeterminado
    ├── bannerIndex.jpeg            # Banner principal del home
    └── ...                         # Fotos, íconos, assets

```

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (Apache, Nginx, Live Server, etc.)
- Cuenta de Firebase (para configuración backend)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/vivarq.git
cd vivarq
```

2. **Configurar Firebase**
   - Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilitar Authentication (Email/Password)
   - Crear una base de datos Cloud Firestore
   - Configurar Storage para imágenes
   - Copiar las credenciales en `js/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
  measurementId: "TU_MEASUREMENT_ID"
};
```

3. **Configurar Firestore Database**

Crear las siguientes colecciones:
- `users`: Información de usuarios
- `projects`: Proyectos publicados
- `messages`: Sistema de mensajería
- `notifications`: Notificaciones del sistema
- `contracts`: Contratos generados

4. **Configurar Storage Rules**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

5. **Iniciar el servidor**
```bash
# Usando Python
python -m http.server 8000

# O usando Node.js con http-server
npx http-server

# O usando Live Server en VS Code
# Click derecho > Open with Live Server
```

6. **Acceder a la aplicación**
```
http://localhost:8000
```

---

## 📖 Uso

### Para Clientes

1. **Registro**: Crear cuenta seleccionando tipo "Cliente/Contratista"
2. **Completar Perfil**: Agregar información de contacto y preferencias
3. **Publicar Proyecto**: Usar el formulario multi-paso para detallar tu proyecto
4. **Buscar Profesionales**: Filtrar por especialidad y ubicación
5. **Contactar**: Enviar mensajes a profesionales de interés
6. **Gestionar**: Seguimiento del proyecto desde el dashboard

### Para Profesionales

1. **Registro**: Crear cuenta seleccionando tipo "Profesional"
2. **Completar Perfil**: Agregar especialidades, experiencia, portafolio y certificaciones
3. **Buscar Proyectos**: Explorar oportunidades según especialidad
4. **Postular**: Enviar propuestas a proyectos de interés
5. **Comunicar**: Chat directo con clientes potenciales
6. **Herramientas**: Usar calculadora de impuestos y generador de contratos

---

## 🔧 Funcionalidades Detalladas

### Sistema de Autenticación
- Registro con email y contraseña
- Verificación de email
- Recuperación de contraseña
- Gestión de sesiones
- Cierre de sesión seguro

### Sistema de Chat
- Mensajería en tiempo real
- Notificaciones de mensajes no leídos
- Historial de conversaciones
- Indicadores de estado online/offline
- Marcado de mensajes como leídos

### Gestión de Proyectos
- Creación con formulario paso a paso
- Categorización por tipo de proyecto
- Carga de imágenes y documentos
- Edición y eliminación
- Estados de proyecto (Abierto, En progreso, Completado)
- Sistema de favoritos

### Calculadora de Impuestos
- Cálculo de aportes colegiales
- Estimación de impuestos
- Cómputo y presupuesto
- Exportación de resultados
- Historial de cálculos

### Generador de Contratos
- Plantillas predefinidas
- Personalización de cláusulas
- Exportación a PDF
- Firma digital
- Almacenamiento en la nube

---

## 🎨 Capturas de Pantalla

### Página Principal
![Home Page](docs/screenshots/home.png)

### Búsqueda de Profesionales
![Professionals Search](docs/screenshots/professionals.png)

### Perfil Profesional
![Professional Profile](docs/screenshots/profile.png)

### Sistema de Chat
![Chat System](docs/screenshots/chat.png)

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

---

## 🔒 Seguridad

- ✅ Autenticación mediante Firebase Authentication
- ✅ Reglas de seguridad en Firestore
- ✅ Validación de datos en cliente y servidor
- ✅ Sanitización de inputs
- ✅ Protección contra XSS
- ✅ HTTPS en producción
- ✅ Tokens de sesión seguros

---

## 🌐 Navegadores Compatibles

- ✅ Chrome (últimas 2 versiones)
- ✅ Firefox (últimas 2 versiones)
- ✅ Safari (últimas 2 versiones)
- ✅ Edge (últimas 2 versiones)
- ✅ Opera (últimas 2 versiones)

---

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 **Mobile**: 320px - 767px
- 📱 **Tablet**: 768px - 1023px
- 💻 **Desktop**: 1024px - 1919px
- 🖥️ **Large Desktop**: 1920px+

---

## 🐛 Solución de Problemas

### Error de conexión a Firebase
- Verificar credenciales en `firebase-config.js`
- Confirmar que el proyecto está activo en Firebase Console
- Revisar reglas de seguridad en Firestore

### Imágenes no se cargan
- Verificar configuración de Storage en Firebase
- Confirmar permisos de lectura/escritura
- Revisar formato y tamaño de imágenes (máx. 5MB)

### Chat no funciona en tiempo real
- Verificar conexión a internet
- Confirmar que Firestore está configurado correctamente
- Revisar reglas de seguridad de la colección `messages`

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guía de Estilo
- Usar nombres descriptivos para variables y funciones
- Comentar código complejo
- Seguir la estructura modular existente
- Mantener consistencia con el estilo actual
- Probar exhaustivamente antes de hacer commit

---

## 📝 Roadmap

### Versión 2.0 (Planificado)
- [ ] Sistema de valoraciones y reseñas
- [ ] Integración con pasarelas de pago
- [ ] Notificaciones push
- [ ] App móvil nativa (iOS/Android)
- [ ] Panel de administración
- [ ] Analytics avanzados
- [ ] Integración con Google Maps API
- [ ] Sistema de videollamadas
- [ ] Marketplace de materiales
- [ ] Búsqueda con IA

### Versión 1.5 (En desarrollo)
- [ ] Mejoras en el sistema de notificaciones
- [ ] Filtros avanzados de búsqueda
- [ ] Exportación de datos
- [ ] Modo oscuro
- [ ] Multiidioma (Inglés, Portugués)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor

**Nicolás Corera**
- Instagram: [@nicocorera](https://www.instagram.com/nicocorera)
- Email: contacto@vivarq.com.ar

---

## 🙏 Agradecimientos

- Firebase por la infraestructura backend
- Font Awesome por la iconografía
- Comunidad de desarrolladores que contribuyeron con feedback
- Profesionales de la construcción que probaron la plataforma

---

## 📞 Contacto y Soporte

- **Email**: contacto@vivarq.com.ar
- **Website**: https://vivarq.com.ar
- **Ubicación**: Buenos Aires, Argentina

### Soporte Técnico
Para reportar bugs o solicitar features, por favor abre un issue en GitHub o contacta directamente al equipo de desarrollo.

---

## 📊 Estado del Proyecto

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

**VivArq** - Transformando la construcción en Argentina, un proyecto a la vez 🏗️✨