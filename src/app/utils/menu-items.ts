export interface Route {
  title: string;
  path: string;
  icon?: string;
  children?: Route[];
  role?: string[];
}

export const MENU_ITEMS: Route[] = [
  {
    title: "Dashboard General",
    path: "/dashboard",
    icon: "chart-bar",
    role: ["ADMIN", "USER"],
  },
  {
    title: "Usuarios",
    path: "/usuarios",
    icon: "users",
    role: ["ADMIN"],
  },
  {
    title: "Módulo Galpón",
    path: "/modulo-galpon",
    icon: "warehouse",
    role: ["ADMIN", "USER"],
    children: [
      {
        title: "Maestros",
        path: "/modulo-galpon/masters",
        icon: "database",
        role: ["ADMIN", "USER"],
        children: [
          { title: "Casa", path: "/modulo-galpon/casa", icon: "house", role: ["ADMIN", "USER"] },
          { title: "Alimento", path: "/modulo-galpon/alimento", icon: "bone", role: ["ADMIN", "USER"] },
          { title: "Vacunas", path: "/modulo-galpon/vacunas", icon: "syringe", role: ["ADMIN", "USER"] },
          { title: "Proveedor", path: "/modulo-galpon/proveedor", icon: "truck", role: ["ADMIN", "USER"] },
          { title: "Ubicaciones", path: "/modulo-galpon/ubicaciones", icon: "map-marker", role: ["ADMIN", "USER"] },
          { title: "Tipo de Proveedores", path: "/modulo-galpon/tipo-proveedores", icon: "tags", role: ["ADMIN", "USER"] },
          { title: "Galpón", path: "/modulo-galpon/galpon", icon: "home", role: ["ADMIN", "USER"] },
          { title: "Productos", path: "/modulo-galpon/productos", icon: "box", role: ["ADMIN", "USER"] },
          { title: "Gallinas", path: "/modulo-galpon/gallinas", icon: "feather", role: ["ADMIN", "USER"] },
          { title: "Producción de huevos", path: "/modulo-galpon/produccion-de-huevos", icon: "egg", role: ["ADMIN", "USER"] },
        ],
      },
      {
        title: "Funcionalidades",
        path: "/modulo-galpon/funcionalidades",
        icon: "cogs",
        role: ["ADMIN", "USER"],
        children: [
          { title: "Kardex", path: "/modulo-galpon/kardex", icon: "clipboard-list", role: ["ADMIN", "USER"] },
          { title: "Kardex de Procesos", path: "/modulo-galpon/kardex-de-procesos", icon: "clipboard-check", role: ["ADMIN", "USER"] },
          { title: "Kardex Materias Primas", path: "/modulo-galpon/kardex-materias-primas", icon: "clipboard", role: ["ADMIN", "USER"] },
          { title: "Consumo Interno", path: "/modulo-galpon/consumo-interno", icon: "utensils", role: ["ADMIN", "USER"] },
          { title: "Costo de alimento", path: "/modulo-galpon/costo-de-alimento", icon: "dollar-sign", role: ["ADMIN", "USER"] },
          { title: "Costo Adicional", path: "/modulo-galpon/costo-adicional", icon: "money-bill", role: ["ADMIN", "USER"] },
          { title: "Ciclo de vida", path: "/modulo-galpon/ciclo-de-vida", icon: "sync", role: ["ADMIN", "USER"] },
          { title: "Ventas", path: "/modulo-galpon/ventas", icon: "shopping-cart", role: ["ADMIN", "USER"] },
          { title: "Aplicación Vacunas", path: "/modulo-galpon/vaccine-aplications", icon: "prescription-bottle-alt", role: ["ADMIN", "USER"] },
        ],
      },
    ],
  },
  {
    title: "Módulo Bienestar Común",
    path: "/modulo-bienestar-comun",
    icon: "heart",
    role: ["ADMIN", "USER"],
    children: [
      { title: "Maestros", path: "/modulo-bienestar-comun/masters", icon: "folder", role: ["ADMIN", "USER"] },
    ],
  },
  {
    title: "Módulo Psicología",
    path: "/modulo-psicologia",
    icon: "brain",
    role: ["ADMIN", "USER"],
    children: [
      { title: "Maestros", path: "/modulo-psicologia/masters", icon: "folder-open", role: ["ADMIN", "USER"] },
    ],
  },
];
