import React from 'react';

interface ToastProps {
  id: string;
  title: string;
  description?: string;
}

const ToastComponent: React.FC<ToastProps> = ({ title, description }) => {
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: 'white', padding: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
      <strong>{title}</strong>
      {description && <div>{description}</div>}
    </div>
  );
};

export default ToastComponent;