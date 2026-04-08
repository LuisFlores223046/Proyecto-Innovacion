import { Outlet } from "react-router-dom";
import { SideBar } from "./SideBar";

export const MainLayout = () => {
    return (
        <div className="flex flex-col-reverse sm:flex-row h-screen ">
            <SideBar />
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};
