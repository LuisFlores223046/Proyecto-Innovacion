import { type JSX } from "react";

interface Props {
    options: { value: string | number; label: string }[];
    className?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    name: string;
    label?: string;
    showLabel?: boolean;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
}

export default function Select({
    options,
    className = '',
    value,
    onChange,
    name,
    label,
    showLabel = true,
    required = false,
    disabled = false,
    placeholder
}: Props): JSX.Element {
    const defaultPlaceholder = placeholder !== undefined ? placeholder : (label ? `Seleccionar ${label}` : 'Seleccionar');

    return (
        <div className="flex flex-col gap-2">
            {showLabel && label && (
                <label htmlFor={name} className={`text-sm font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                    {label}
                </label>
            )}
            <select
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`w-full pl-4 pr-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:outline-none focus:ring-blue-500 bg-white text-sm disabled:bg-gray-50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-[position:right_1rem_center] bg-no-repeat ${className}`}
            >
                <option value="">{defaultPlaceholder}</option>
                {options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    );
}