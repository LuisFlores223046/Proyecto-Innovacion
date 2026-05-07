/**
 * setup.ts — Se ejecuta antes de todos los tests.
 * Extiende los matchers de Vitest con los de @testing-library/jest-dom
 * para poder usar: toBeInTheDocument(), toHaveValue(), toBeDisabled(), etc.
 */
import "@testing-library/jest-dom";
