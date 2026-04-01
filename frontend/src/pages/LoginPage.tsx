import { useContext, useState } from "react"
import { UserContext } from "../context/UseContext"
import { toast } from "sonner"
import { Link, useNavigate } from "react-router"


export const Loginpage = () => {
    const { login } = useContext(UserContext)
    const [adminId, setadminId] = useState('')
    const [adminpassword, setadminpassword] = useState('')
    const navegation = useNavigate()


    const handlesumit = (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault() //evita que la pagina se recargue innecesariamente

        const result = login(+adminId, adminpassword)

        if (!result) {
            toast.error('no fue posible iniciar secion')
            return
        }

        navegation('/buscar') //direccion a la que ira la pagina
    }
    return (
        <div>
            <h1>Iniciar sesion</h1>

            <form
                onSubmit={handlesumit}
            >
                <input
                    type="number"
                    placeholder="ID del administrador"
                    value={adminId}
                    onChange={event => setadminId(event.target.value)}
                />
                <input
                    type="text"
                    placeholder="Contraseña"
                    value={adminpassword}
                    onChange={event => setadminpassword(event.target.value)}
                />

                <button type="submit">Iniciar</button>
            </form>

            <Link to='/'>
                <button>volver a la pantalla principal</button>
            </Link>
        </div>
    )
}
