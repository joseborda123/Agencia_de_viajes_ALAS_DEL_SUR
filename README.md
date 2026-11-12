# Alas del Sur - Gestión de agencia de viajes

Aplicación web (HTML + CSS + JS) conectada a Supabase.

## Estructura
```
agencia-viajes/
├── index.html              Estructura de la página
├── css/styles.css          Estilos
├── js/config.js            URL y clave de Supabase  <-- EDITAR
├── js/app.js               Lógica (CRUD de cliente, destino, paquetes, reservas)
└── supabase-policies.sql   Permisos (RLS) para las 4 tablas
```

## Cómo conectarla
1. Abre `js/config.js` y reemplaza `SUPABASE_URL` y `SUPABASE_KEY`
   (Supabase > Project Settings > API: Project URL y clave "anon public").
2. Ejecuta `supabase-policies.sql` en el SQL Editor de Supabase.
3. Verifica que los IDs de las tablas sean "Identity" (autoincrementales).
4. Abre `index.html` en el navegador o sírvelo con Live Server / `npx serve`.
