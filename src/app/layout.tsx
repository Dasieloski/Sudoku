import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ToastComponent from '../components/ToastComponent'; // Ajusta la ruta según la estructura de tu proyecto

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

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

export default function RootLayout({
  children,
  state, // Añade state como una prop
}: Readonly<{
  children: React.ReactNode;
  state: { toasts: Array<Toast> }; // Utiliza el tipo Toast en la definición de state
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Asegúrate de que state y state.toasts están definidos antes de usarlos */}
        {state?.toasts?.map(toast => (
          <ToastComponent key={toast.id} title={toast.title || "Título predeterminado"} {...toast} />
        ))}
      </body>
    </html>
  );
}
