# Guía de Instalación y Ejecución - Proyecto-BMB

Esta guía te ayudará a instalar y ejecutar el proyecto de Calendario de Eventos desde cero.

## Requisitos Previos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [npm](https://www.npmjs.com/) (normalmente viene con Node.js)
- [Git](https://git-scm.com/)

## Pasos de Instalación

### 1. Clonar el Repositorio

Abre una terminal y ejecuta el siguiente comando:

```bash
git clone https://github.com/deborahmaier/Proyecto-BMB.git
cd Proyecto-BMB
```

### 2. Instalar Dependencias del Frontend

Desde la carpeta raíz del proyecto, ejecuta:

```bash
npm install
```

### 3. Instalar Dependencias del Backend

Navega a la carpeta del backend e instala sus dependencias:

```bash
cd backend
npm install
npm install sqlite3
cd ..
```

> **Nota**: Es importante instalar explícitamente `sqlite3` ya que está en las dependencias del proyecto pero podría no instalarse correctamente de forma automática.

## Ejecución del Proyecto

### 1. Iniciar el Servidor Backend

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
cd backend
node server.js
```

Deberías ver un mensaje indicando que el servidor está escuchando en http://localhost:5000 y que se ha conectado correctamente a la base de datos SQLite.

### 2. Iniciar la Aplicación Frontend

Sin cerrar la terminal anterior, abre otra terminal en la carpeta raíz del proyecto y ejecuta:

```bash
npm run dev
```

Este comando iniciará la aplicación de React con Vite. Verás un mensaje con la URL donde está ejecutándose la aplicación, normalmente http://localhost:5173.

### 3. Acceder a la Aplicación

Abre tu navegador web y navega a la URL mostrada en la terminal (por defecto http://localhost:5173).

## Funcionalidades Principales

La aplicación de Calendario de Eventos te permite:

- Ver eventos en formato de calendario mensual, semanal o diario
- Agregar nuevos eventos
- Editar eventos existentes
- Eliminar eventos
- Navegar entre diferentes fechas y vistas del calendario

## Solución de Problemas Comunes

### Error de conexión al backend

Si la aplicación no puede cargar los eventos, asegúrate de que:

1. El servidor backend está ejecutándose en http://localhost:5000
2. No hay restricciones de CORS en tu navegador
3. La base de datos SQLite se ha creado correctamente

### Error al instalar sqlite3

Si tienes problemas al instalar sqlite3, prueba:

```bash
npm install sqlite3 --build-from-source
```

Para entornos Windows, puede ser necesario instalar herramientas adicionales:

```bash
npm install --global --production windows-build-tools
```

## Desarrollo y Mantenimiento

Para mantener el proyecto actualizado:

```bash
git pull origin main
npm install
cd backend
npm install
cd ..
```

---

Para cualquier problema o sugerencia, puedes crear un issue en el repositorio GitHub.
