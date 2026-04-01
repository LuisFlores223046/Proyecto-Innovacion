// Definición de los tipos de ocupación permitidos
type ocupation = 'Estudiante' | 'Docente' | 'Administrativo'

// Interfaz que define los datos que el administrador deberá tener
export interface Admins {
    ID: number
    password: string
    name: string
    last_name: string
    ocupation: ocupation
}

// Arreglo de objetos con los datos de prueba
export const admins: Admins[] = [
    {
        ID: 1001,
        password: 'hola',
        name: 'Edwin',
        last_name: 'Echeverria',
        ocupation: 'Estudiante'
    },
    {
        ID: 1002,
        password: 'adios',
        name: 'Benito',
        last_name: 'Ponce',
        ocupation: 'Docente'
    }
]