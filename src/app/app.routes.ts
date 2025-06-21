import { AuthGuard } from './auth/guards/auth.guard';
import { Routes } from "@angular/router"
import { ProfileComponent } from "./auth/profile/profile.component"
import { ConfigurationComponent } from "./auth/configuration/configuration.component"

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar Sesión',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [AuthGuard],
    data: { public: true },
  },
  {
    path: '',
    canMatch: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard General',
        loadComponent: () => import('./components/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: "usuarios",
        canMatch: [AuthGuard],
        data: { role: "ADMIN" },
        title: "Gestión de Usuarios",
        loadComponent: () =>
          import("./components/pages/users/users.component").then(
            (m) => m.UsersComponent
          ),
      },

      // ✅ SOLUCIÓN: Rutas directas sin ComponentsComponent wrapper
      {
        path: 'modulo-galpon',
        children: [
          {
            path: 'masters',
            title: 'Maestros Galpón',
            loadComponent: () => import('./components/pages/main/food/food.component').then(m => m.FoodComponent)
          },
          {
            path: 'alimento',
            title: 'Maestros Food',
            loadComponent: () => import('./components/pages/main/food/food.component').then(m => m.FoodComponent)
          },
          {
            path: 'casa',
            title: 'Maestros Casa',
            loadComponent: () => import('./components/pages/main/home/home.component').then(m => m.HomeComponent)
          },
          {
            path: 'vacunas',
            title: 'Maestro Vacuna',
            loadComponent: () => import('./components/pages/main/vaccine/vaccine.component').then(m => m.VaccineComponent)
          },
          {
            path: 'proveedor',
            title: 'Maestros Proveedor',
            loadComponent: () => import('./components/pages/main/proveedor/proveedor.component').then(m => m.ProveedorComponent)
          },
          {
            path: 'ubicaciones',
            title: 'Ubicaciones',
            loadComponent: () => import('./components/pages/main/location/location.component').then(m => m.LocationComponent)
          },
          {
            path: 'tipo-proveedores',
            title: 'Tipo de Proveedores',
            loadComponent: () => import('./components/pages/main/type-supplier/type-supplier.component').then(m => m.TypeSupplierComponent)
          },
          {
            path: 'galpon',
            title: 'Galpón',
            loadComponent: () => import('./components/pages/main/shed/shed.component').then(m => m.ShedComponent)
          },
          {
            path: 'productos',
            title: 'Productos',
            loadComponent: () => import('./components/pages/main/product/product.component').then(m => m.ProductComponent)
          },
          {
            path: 'gallinas',
            title: 'Gallinas',
            loadComponent: () => import('./components/pages/main/hen/hen.component').then(m => m.HenComponent)
          },
          {
            path: 'produccion-de-huevos',
            title: 'Producción de huevos',
            loadComponent: () => import('./components/pages/main/egg-production/egg-production.component').then(m => m.EggProductionComponent)
          },
          {
            path: 'kardex',
            title: 'Kardex',
            loadComponent: () => import('./components/pages/Features/kardex-egg/kardex-egg.component').then(m => m.KardexEggComponent)
          },
          {
            path: 'kardex-de-procesos',
            title: 'Kardex de Procesos',
            loadComponent: () => import('./components/pages/Features/kardex-process/kardex-process.component').then(m => m.KardexProcessComponent)
          },
          {
            path: 'kardex-materias-primas',
            title: 'Kardex Materias Primas',
            loadComponent: () => import('./components/pages/Features/kardex-primal/kardex-primal.component').then(m => m.KardexPrimalComponent)
          },
          {
            path: 'consumo-interno',
            title: 'Consumo de Interno',
            loadComponent: () => import('./components/pages/Features/consumption-internal/consumption-internal.component').then(m => m.ConsumptionInternalComponent)
          },
          {
            path: 'costo-de-alimento',
            title: 'Costo de alimento',
            loadComponent: () => import('./components/pages/Features/costs-food/costs-food.component').then(m => m.CostsFoodComponent)
          },
          {
            path: 'costo-adicional',
            title: 'Costo Adicional',
            loadComponent: () => import('./components/pages/Features/additional-cost/additional-cost.component').then(m => m.AdditionalCostComponent)
          },
          {
            path: 'ciclo-de-vida',
            title: 'Ciclo de vida',
            loadComponent: () => import('./components/pages/Features/lifecycle/lifecycle.component').then(m => m.LifecycleComponent)
          },
          {
            path: 'ventas',
            title: 'Ventas',
            loadComponent: () => import('./components/pages/Features/sale/sale.component').then(m => m.SaleComponent)
          },
          {
            path: 'vaccine-aplications',
            title: 'Aplicación Vacunas',
            loadComponent: () => import('./components/pages/Features/vaccineAplications/vaccine-aplications.component').then(m => m.VaccineApplicationsComponent)
          },
          // Ruta por defecto para el módulo
          { path: '', redirectTo: 'masters', pathMatch: 'full' }
        ]
      },

      {
        path: 'modulo-bienestar-comun',
        children: [
          {
            path: 'masters',
            title: 'Maestros Bienestar',
            loadComponent: () => import('./components/pages/main/masters.component').then(m => m.MastersComponent)
          },
          { path: '', redirectTo: 'masters', pathMatch: 'full' }
        ]
      },

      {
        path: 'modulo-psicologia',
        children: [
          {
            path: 'masters',
            title: 'Maestros Psicología',
            loadComponent: () => import('./components/pages/main/food/food.component').then(m => m.FoodComponent)
          },
          { path: '', redirectTo: 'masters', pathMatch: 'full' }
        ]
      },

      // Módulo de perfil
      {
        path: 'perfil',
        component: ProfileComponent,
        canActivate: [AuthGuard]
      },

      // Módulo de configuración
      {
        path: 'configuracion',
        component: ConfigurationComponent,
        canActivate: [AuthGuard]
      }
    ]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];