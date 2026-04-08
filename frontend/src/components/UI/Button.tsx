import { type JSX } from "react";

interface Props {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
}

export default function Button({ children, onClick, className }: Props): JSX.Element {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 bg-[#003DA5] text-white rounded-md hover:bg-[#1A5FD4] transition-colors cursor-pointer ${className}`}
        >
            {children}
        </button>
    );
}