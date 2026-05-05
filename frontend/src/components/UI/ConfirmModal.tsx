import type { JSX } from "react";
import Modal from "./Modal";
import Button from "./Button";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

export default function ConfirmModal({ 
    isOpen, onClose, onConfirm, title, message, 
    confirmText = "Confirmar", cancelText = "Cancelar", isDanger = false 
}: Props): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col gap-6 p-2">
                <p className="text-gray-600 font-medium text-lg leading-relaxed">{message}</p>
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose}>{cancelText}</Button>
                    <Button variant={isDanger ? "danger" : "primary"} onClick={() => {
                        onConfirm();
                        onClose();
                    }}>{confirmText}</Button>
                </div>
            </div>
        </Modal>
    );
}
