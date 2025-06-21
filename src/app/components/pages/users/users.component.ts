import { User } from './../../../../model/User';
import { AuthService } from './../../../auth/service/auth.services';
import { UserService } from './../../../../service/user.service';
import { Component, OnInit, OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { UserModalComponent } from "./user-modal/user-modal.component"
import { Subject, takeUntil, finalize } from "rxjs"
import Swal from "sweetalert2"

@Component({
    selector: "app-users",
    templateUrl: "./users.component.html",
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, UserModalComponent],
    styleUrls: ["./users.component.css"],
})
export class UsersComponent implements OnInit, OnDestroy {
    users: User[] = []
    filteredUsers: User[] = []
    isLoading = true
    hasError = false
    error = ""

    // Modal y formulario
    isFormVisible = false
    isEditing = false
    selectedUser: User | null = null

    // Búsqueda
    searchTerm = ""

    // Permisos
    isAdmin = false

    // Para cleanup de subscripciones
    private destroy$ = new Subject<void>()

    constructor(
        private userService: UserService,
        private authService: AuthService,
    ) { }

    ngOnInit(): void {
        this.checkUserPermissions()
        this.loadUsers()
    }

    ngOnDestroy(): void {
        this.destroy$.next()
        this.destroy$.complete()
    }

    /**
     * 🔐 Verificar permisos del usuario
     */
    checkUserPermissions(): void {
        this.isAdmin = this.authService.isAdminSync()
        console.log("👤 Permisos del usuario - Es Admin:", this.isAdmin)
    }

    /**
     * 📋 Cargar lista de usuarios desde el backend
     */
    loadUsers(): void {
        this.isLoading = true
        this.hasError = false
        this.error = ""

        this.userService
            .getAllUsers()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => (this.isLoading = false)),
            )
            .subscribe({
                next: (users) => {
                    console.log("✅ Usuarios cargados:", users)
                    this.users = users
                    this.filteredUsers = users
                },
                error: (error) => {
                    console.error("❌ Error al cargar usuarios:", error)
                    this.hasError = true
                    this.error = "Error al cargar los usuarios. Por favor, intente nuevamente."

                    Swal.fire({
                        icon: "error",
                        title: "Error al cargar usuarios",
                        text: "No se pudieron cargar los usuarios. Verifique su conexión.",
                        confirmButtonText: "Reintentar",
                    }).then((result) => {
                        if (result.isConfirmed) {
                            this.loadUsers()
                        }
                    })
                },
            })
    }

    /**
     * 🔍 Filtrar usuarios por término de búsqueda
     */
    onSearch(term: string): void {
        this.searchTerm = term.toLowerCase()

        if (!this.searchTerm.trim()) {
            this.filteredUsers = this.users
            return
        }

        this.filteredUsers = this.users.filter(
            (user) =>
                user.name.toLowerCase().includes(this.searchTerm) ||
                user.lastName.toLowerCase().includes(this.searchTerm) ||
                user.email.toLowerCase().includes(this.searchTerm) ||
                user.documentNumber.includes(this.searchTerm) ||
                user.cellPhone.includes(this.searchTerm),
        )
    }

    /**
     * ➕ Abrir formulario para crear nuevo usuario
     */
    openForm(user?: User): void {
        if (!this.isAdmin) {
            Swal.fire({
                icon: "warning",
                title: "Sin permisos",
                text: "No tiene permisos para realizar esta acción.",
                confirmButtonText: "Entendido",
            })
            return
        }

        this.isFormVisible = true
        this.isEditing = !!user

        if (user) {
            // Modo edición - clonar el usuario para evitar mutaciones
            this.selectedUser = { ...user }
            console.log("✏️ Editando usuario:", this.selectedUser)
        } else {
            // Modo creación - usuario vacío
            this.selectedUser = {
                name: "",
                lastName: "",
                documentType: "DNI",
                documentNumber: "",
                cellPhone: "",
                email: "",
                password: "",
                role: ["USER"],
                profileImage: "",
            }
            console.log("➕ Creando nuevo usuario")
        }
    }

    /**
     * ❌ Cerrar formulario
     */
    closeForm(): void {
        this.isFormVisible = false
        this.isEditing = false
        this.selectedUser = null
    }

    /**
     * 💾 Guardar usuario (crear o actualizar)
     */
    saveUser(userData: User): void {
        if (!this.isAdmin) {
            Swal.fire({
                icon: "warning",
                title: "Sin permisos",
                text: "No tiene permisos para realizar esta acción.",
                confirmButtonText: "Entendido",
            })
            return
        }

        console.log("💾 Guardando usuario:", userData)

        // Mostrar loading
        Swal.fire({
            title: this.isEditing ? "Actualizando usuario..." : "Creando usuario...",
            text: "Por favor espere",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading()
            },
        })

        // Preparar archivo si hay imagen en base64
        let imageFile: File | null = null
        if (userData.profileImage && userData.profileImage.startsWith("data:image/")) {
            imageFile = this.base64ToFile(userData.profileImage, "profile-image.jpg")
        }

        const operation = this.isEditing
            ? this.userService.updateUser(userData, imageFile)
            : this.userService.createUser(userData, imageFile)

        operation.pipe(takeUntil(this.destroy$)).subscribe({
            next: (savedUser) => {
                console.log("✅ Usuario guardado exitosamente:", savedUser)

                Swal.fire({
                    icon: "success",
                    title: this.isEditing ? "Usuario actualizado" : "Usuario creado",
                    text: `El usuario ${savedUser.name} ${savedUser.lastName} ha sido ${this.isEditing ? "actualizado" : "creado"} exitosamente.`,
                    timer: 2000,
                    showConfirmButton: false,
                })

                // Actualizar la lista local
                if (this.isEditing) {
                    const index = this.users.findIndex((u) => u.id === savedUser.id)
                    if (index !== -1) {
                        this.users[index] = savedUser
                    }
                } else {
                    this.users.unshift(savedUser)
                }

                // Aplicar filtro actual
                this.onSearch(this.searchTerm)

                // Cerrar formulario
                this.closeForm()
            },
            error: (error) => {
                console.error("❌ Error al guardar usuario:", error)

                Swal.fire({
                    icon: "error",
                    title: "Error al guardar",
                    text: error.message || "No se pudo guardar el usuario. Intente nuevamente.",
                    confirmButtonText: "Entendido",
                })
            },
        })
    }

    /**
     * 🗑️ Eliminar usuario
     */
    deleteUser(userId: number): void {
        if (!this.isAdmin) {
            Swal.fire({
                icon: "warning",
                title: "Sin permisos",
                text: "No tiene permisos para realizar esta acción.",
                confirmButtonText: "Entendido",
            })
            return
        }

        const user = this.users.find((u) => u.id === userId)
        if (!user) return

        Swal.fire({
            title: "¿Eliminar usuario?",
            text: `¿Está seguro de eliminar a ${user.name} ${user.lastName}? Esta acción no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                // Mostrar loading
                Swal.fire({
                    title: "Eliminando usuario...",
                    text: "Por favor espere",
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading()
                    },
                })

                this.userService
                    .deleteUser(userId)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            console.log("✅ Usuario eliminado exitosamente")

                            Swal.fire({
                                icon: "success",
                                title: "Usuario eliminado",
                                text: `${user.name} ${user.lastName} ha sido eliminado exitosamente.`,
                                timer: 2000,
                                showConfirmButton: false,
                            })

                            // Remover de la lista local
                            this.users = this.users.filter((u) => u.id !== userId)
                            this.onSearch(this.searchTerm) // Aplicar filtro actual
                        },
                        error: (error) => {
                            console.error("❌ Error al eliminar usuario:", error)

                            Swal.fire({
                                icon: "error",
                                title: "Error al eliminar",
                                text: error.message || "No se pudo eliminar el usuario. Intente nuevamente.",
                                confirmButtonText: "Entendido",
                            })
                        },
                    })
            }
        })
    }

    /**
     * 🔄 Recargar lista de usuarios
     */
    refreshUsers(): void {
        this.loadUsers()
    }

    /**
     * 🖼️ Convertir base64 a File para envío al backend
     */
    private base64ToFile(base64String: string, filename: string): File {
        const arr = base64String.split(",")
        const mime = arr[0].match(/:(.*?);/)![1]
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
        }

        return new File([u8arr], filename, { type: mime })
    }
}
