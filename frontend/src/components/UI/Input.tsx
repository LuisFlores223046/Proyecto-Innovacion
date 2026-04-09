import { type JSX, type InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    name: string;
    showLabel?: boolean;
    icon?: React.ReactNode;
}

export default function Input({ 
    label, 
    name, 
    className = '', 
    showLabel = true,
    icon,
    ...props 
}: Props): JSX.Element {
    return (
        <div className="flex flex-col gap-2 relative">
            {showLabel && label && <label htmlFor={name}>{label}</label>}
            <div className="relative flex items-center w-full">
                {icon && <div className="absolute left-4 text-gray-400">{icon}</div>}
                <input
                    id={name}
                    name={name}
                    className={`w-full py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${icon ? 'pl-11 pr-4' : 'px-4'} ${className}`}
                    {...props}
                />
            </div>
        </div>
    );
}
