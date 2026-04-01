import { createContext, useState, type PropsWithChildren } from "react"
import { admins, type Admins } from "../mock/AdminMock"

//estado del usuario
type AuthStatus = 'sin_autenticar' | 'autenticado' | 'no-auntenticado'

//estructura del UseContext
interface UserContextProps {
    authstatus: AuthStatus,
    admin: Admins | null,
    isAuthenticated: boolean

    login: (adminId: number, adminpass: string) => boolean
}

export const UserContext = createContext({} as UserContextProps)


export const UserContextprovider = ({ children }: PropsWithChildren) => {
    const [admin, setadmin] = useState<Admins | null>(null)
    const [status, setstatus] = useState<AuthStatus>('sin_autenticar')

    const HandleLogin = (adminId: number, adminpass: string) => {
        //busca en los administradores si existe el ID y contraseña
        const admin = admins.find(admin => (admin.ID === adminId))
        const password = admins.find(admin => (admin.password === adminpass))

        //en caso de no existir se le negara el acceso
        if (!admin) {
            console.log(`no se encontro el usuario ${adminId}`)
            setadmin(null)
            setstatus('no-auntenticado')
            return false
        }

        if (!password) {
            console.log('no coincide la contraseña')
            setadmin(null)
            setstatus('no-auntenticado')
            return false
        }

        //se le da acceso en dado caso de encontrar el ID
        setadmin(admin)
        setstatus('autenticado')
        localStorage.setItem('adminId', adminId.toString())
        return true
    }

    return <UserContext.Provider
        value={{
            authstatus: status,
            admin: admin,
            isAuthenticated: status === 'autenticado',

            login: HandleLogin
        }}
    >
        {children}
    </UserContext.Provider>
}
