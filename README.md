# 🌱 Habit Tracker Cloud

Aplicación móvil moderna para construir y mantener hábitos diarios, potenciada con **Supabase** para sincronización en la nube en tiempo real. Desarrollada con **React Native** y **Expo**.

---

## ✨ Funcionalidades Avanzadas

- **☁️ Sincronización en la Nube**: Tus datos siempre a salvo y sincronizados entre dispositivos usando Supabase.
- **🔐 Autenticación Segura**: Sistema de registro e inicio de sesión con validación de correo.
- **📈 Estadísticas Pro**: Gráficas dinámicas de progreso semanal y mensual usando `react-native-chart-kit`.
- **🔥 Sistema de Rachas**: Algoritmo avanzado para calcular y visualizar tus rachas actuales y récords.
- **🎨 Temas Inteligentes**: Soporte para Modo Claro, Modo Oscuro y Sincronización con el Sistema.
- **🔔 Recordatorios Inteligentes**: Notificaciones locales programables para cada hábito.
- **✨ Experiencia Premium**: Animaciones fluidas con `react-native-reanimated` y diseño moderno.

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **React Native / Expo** | Framework móvil principal |
| **Supabase** | Base de datos Postgres y Autenticación |
| **Zustand** | Gestión de estado global |
| **AsyncStorage** | Caché local y persistencia offline |
| **Reanimated / Confetti** | Animaciones y feedback visual |
| **Chart Kit** | Visualización de datos y analíticas |

---

## 🚀 Instalación y Configuración

### 1. Requisitos previos
- Node.js 18+
- Expo Go en tu celular o emulador.
- Una cuenta en [Supabase](https://supabase.com).

### 2. Configuración de la Base de Datos
En tu proyecto de Supabase, ve al **SQL Editor** y ejecuta los comandos del archivo `supabase_setup.sql` para crear las tablas y las políticas de seguridad (RLS).

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz (puedes usar `.env.example` como base) y añade tus credenciales:
```bash
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
```

### 4. Instalación Local
```bash
# Clona e instala
git clone https://github.com/tu-usuario/Habit-Tracker.git
npm install

# Inicia (con limpieza de caché recomendada para .env)
npx expo start -c
```

---

## 🤝 Contribuciones

1. Haz un fork del proyecto
2. Crea una rama: `git checkout -b feature/mejora`
3. Haz commit: `git commit -m "feat: descripción"`
4. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

**Desarrollado con ❤️ por José Pérez**