import { Outlet } from "react-router-dom";
import { SideBar } from "./SideBar";

export const MainLayout = () => {
    return (
        <div className="flex flex-col sm:flex-row h-screen">
            <SideBar />
            <main className="h-full sm:flex-1 sm:overflow-auto">
                <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-gray-50">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
