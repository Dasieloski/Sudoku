import React from 'react'; // Asegúrate de importar React
import type { Metadata } from "next";
import "./globals.css";
import ToastComponent from '../components/ToastComponent'; // Ajusta la ruta según la estructura de tu proyecto

export const metadata: Metadata = {
  title: "Sudoku Maritza",
  description: "MCC",
};

// Define un tipo específico para los elementos del array toasts
type Toast = {
  id: string;
  title?: string;
  // Agrega otros campos específicos que necesites, por ejemplo:
  message?: string;
  duration?: number;
};

// Define las props del componente Layout
interface LayoutProps {
  children: React.ReactNode;
  state: {
    toasts: Toast[];
  };
}

// Componente Layout con tipado correcto
const Layout: React.FC<LayoutProps> = ({ children, state }) => {
  return (
    <div style={{ fontFamily: "var(--font-geist-sans)" }}>
      {children}
      {state.toasts.map(({ id, title, message, duration }) => (
        <ToastComponent 
          key={id} 
          title={title || "Título predeterminado"} // Proporciona un título predeterminado si title es undefined
          message={message || "Mensaje predeterminado"} // Proporciona un mensaje predeterminado si message es undefined
          duration={duration || 5000} // Proporciona una duración predeterminada si duration es undefined
        />
      ))}
    </div>
  );
};

export default Layout; // Asegúrate de que la exportación por defecto esté correctamente definida
