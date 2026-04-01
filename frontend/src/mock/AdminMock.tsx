// Interfaz que define los datos que el administrador deberá tener
export interface Admin {
    id: number;
    username: string;
    email: string;
    activo: boolean;
    creado_en: string;
}

// Arreglo de objetos con los datos de prueba
export const admins: Admin[] = [
    {
        id: 1001,
        username: 'eecheverria',
        email: 'edwin.echeverria@uacj.mx',
        activo: true,
        creado_en: '2026-03-30T10:00:00Z'
    },
    {
        id: 1002,
        username: 'bponce',
        email: 'benito.ponce@uacj.mx',
        activo: true,
        creado_en: '2026-03-30T10:00:00Z'
    }
];