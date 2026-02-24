# 🌱 Habit Tracker

Aplicación móvil para construir y mantener hábitos diarios, desarrollada con **React Native** y **Expo**. Disponible para Android e iOS.

---

## ✨ Funcionalidades

- ✅ Crear hábitos personalizados con ícono y color
- ✅ Marcar hábitos como completados cada día
- ✅ Sistema de rachas (streaks) para mantenerte motivado
- ✅ Estadísticas detalladas por hábito y globales
- ✅ Calendario visual de los últimos 30 días
- ✅ Notificaciones diarias de recordatorio
- ✅ Tema oscuro y claro
- ✅ Datos guardados localmente en el dispositivo
- ✅ Onboarding para nuevos usuarios

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| React Native | Framework principal |
| Expo SDK 51 | Herramientas y build |
| Expo Router | Navegación por archivos |
| Zustand | Estado global |
| AsyncStorage | Persistencia de datos |
| Expo Notifications | Notificaciones locales |
| React Native Reanimated | Animaciones |
| TypeScript | Tipado estático |

---

## 📁 Estructura del proyecto

```
Habit-Tracker/
├── app/
│   ├── _layout.tsx          # Layout raíz
│   ├── index.tsx            # Redirección inicial
│   ├── onboarding.tsx       # Pantalla de bienvenida
│   ├── add-habit.tsx        # Agregar hábito
│   ├── habit-detail.tsx     # Detalle de hábito
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar
│       ├── home.tsx         # Inicio
│       ├── stats.tsx        # Estadísticas
│       └── settings.tsx     # Configuración
├── src/
│   ├── screens/             # Pantallas principales
│   ├── components/          # Componentes reutilizables
│   ├── store/               # Estado global (Zustand)
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Funciones auxiliares
│   └── theme/               # Colores y estilos
├── assets/
└── app.json
```

---

## 🚀 Instalación y uso

### Requisitos previos
- Node.js 18 o superior
- npm o yarn
- Expo Go (en tu celular) o un emulador Android/iOS

### Pasos

```bash
# 1. Clona el repositorio
git clone https://github.com/tu-usuario/Habit-Tracker.git

# 2. Entra al directorio
cd Habit-Tracker

# 3. Instala las dependencias
npm install

# 4. Inicia el servidor de desarrollo
npx expo start
```

Luego escanea el código QR con la app **Expo Go** en tu celular.

---

## 📱 Pantallas

| Pantalla | Descripción |
|---|---|
| Onboarding | Presentación para nuevos usuarios |
| Inicio | Lista de hábitos del día con progreso |
| Agregar hábito | Crear hábito con ícono y color |
| Detalle | Racha, calendario y estadísticas del hábito |
| Estadísticas | Resumen global y gráfica semanal |
| Configuración | Tema, notificaciones y preferencias |

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si encuentras un error o tienes una sugerencia:

1. Haz un fork del proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Haz commit de tus cambios: `git commit -m "feat: agrega nueva funcionalidad"`
4. Sube la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

Desarrollado por José Pérez usando React Native y Expo.