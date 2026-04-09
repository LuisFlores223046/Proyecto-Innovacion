import { type JSX } from "react";

interface Props {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    variant?: 'primary' | 'danger' | 'ghost' | 'link' | 'link-danger';
    type?: 'button' | 'submit' | 'reset';
}

export default function Button({
    children,
    onClick,
    className = '',
    disabled,
    variant = 'primary',
    type = 'button'
}: Props): JSX.Element {
    let variantStyles = '';

    switch (variant) {
        case 'primary':
            variantStyles = 'bg-[#003DA5] text-white hover:bg-[#1A5FD4] font-semibold px-4 py-2 rounded-md';
            break;
        case 'danger':
            variantStyles = 'bg-red-600 text-white hover:bg-red-700 font-semibold px-4 py-2 rounded-md';
            break;
        case 'ghost':
            variantStyles = 'bg-transparent text-[#003DA5] font-semibold px-4 py-2 rounded-md outline-none';
            break;
        case 'link':
            variantStyles = 'bg-transparent text-[#003DA5] underline outline-none';
            break;
        case 'link-danger':
            variantStyles = 'bg-transparent text-red-600 underline outline-none';
            break;
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles} ${className}`}
        >
            {children}
        </button>
    );
}