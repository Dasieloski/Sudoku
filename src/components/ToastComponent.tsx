import React from 'react';

interface ToastProps {
  key: string;
  title: string;
  // Asegúrate de incluir 'message' en las propiedades del componente
  message: string; // Agrega esta línea
  duration: number;
}

// Asegúrate de que el componente use la prop 'message' correctamente
const ToastComponent: React.FC<ToastProps> = ({ title, message }) => {
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: 'white', padding: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
      <strong>{title}</strong>
      {message && <div>{message}</div>}
    </div>
  );
};

export default ToastComponent;