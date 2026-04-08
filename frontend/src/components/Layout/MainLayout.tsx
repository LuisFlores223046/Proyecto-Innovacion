import { Outlet } from "react-router-dom";
import { SideBar } from "./SideBar";

export const MainLayout = () => {
    return (
        <div className="flex flex-col-reverse sm:flex-row h-screen ">
            <SideBar />
            <main className="h-full sm:flex-1 sm:overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};
