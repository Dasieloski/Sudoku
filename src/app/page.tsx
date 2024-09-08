'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Undo, RotateCcw, HelpCircle, Sun, Moon, Save, Download, Pause, Play } from 'lucide-react'
import confetti from 'canvas-confetti'

type ValorCelda = number | null
type TableroSudoku = ValorCelda[][]

const TABLERO_VACIO: TableroSudoku = Array(9).fill(null).map(() => Array(9).fill(null))

const NIVELES_DIFICULTAD = {
    facil: { celdas: 40, nombre: 'Fácil' },
    medio: { celdas: 30, nombre: 'Medio' },
    dificil: { celdas: 20, nombre: 'Difícil' }
}

export default function Sudoku() {
    const [tablero, setTablero] = useState<TableroSudoku>(TABLERO_VACIO)
    const [tableroInicial, setTableroInicial] = useState<TableroSudoku>(TABLERO_VACIO)
    const [celdaSeleccionada, setCeldaSeleccionada] = useState<[number, number] | null>(null)
    const [errores, setErrores] = useState<Set<string>>(new Set())
    const [historial, setHistorial] = useState<TableroSudoku[]>([])
    const [temporizador, setTemporizador] = useState(0)
    const [enEjecucion, setEnEjecucion] = useState(false)
    const [dificultad, setDificultad] = useState<keyof typeof NIVELES_DIFICULTAD>('facil')
    const [modoOscuro, setModoOscuro] = useState(false)
    const [mostrandoPista, setMostrandoPista] = useState(false)
    const [progreso, setProgreso] = useState(0)
    const [volumenSonido, setVolumenSonido] = useState(50)
    const tableroRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()

    useEffect(() => {
        document.body.classList.toggle('dark', modoOscuro)
    }, [modoOscuro])

    useEffect(() => {
        let intervalo: NodeJS.Timeout
        if (enEjecucion) {
            intervalo = setInterval(() => {
                setTemporizador((prevTemporizador) => prevTemporizador + 1)
            }, 1000)
        }
        return () => clearInterval(intervalo)
    }, [enEjecucion])

    useEffect(() => {
        const celdasLlenas = tablero.flat().filter(celda => celda !== null).length
        const celdasIniciales = tableroInicial.flat().filter(celda => celda !== null).length
        const celdasTotales = 81
        const progresoActual = Math.round(((celdasLlenas - celdasIniciales) / (celdasTotales - celdasIniciales)) * 100)
        setProgreso(progresoActual)
    }, [tablero, tableroInicial])

    const esMovimientoValido = (tablero: TableroSudoku, fila: number, columna: number, num: number): boolean => {
        // Verificar fila
        for (let i = 0; i < 9; i++) {
            if (tablero[fila][i] === num) return false
        }

        // Verificar columna
        for (let i = 0; i < 9; i++) {
            if (tablero[i][columna] === num) return false
        }

        // Verificar bloque 3x3
        const filaInicio = Math.floor(fila / 3) * 3
        const columnaInicio = Math.floor(columna / 3) * 3
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (tablero[filaInicio + i][columnaInicio + j] === num) return false
            }
        }

        return true
    }

    const generarSudoku = useCallback(() => {
        const nuevoTablero: TableroSudoku = Array(9).fill(null).map(() => Array(9).fill(null))
        const numParaLlenar = NIVELES_DIFICULTAD[dificultad].celdas

        for (let i = 0; i < numParaLlenar; i++) {
            let fila, columna, num
            do {
                fila = Math.floor(Math.random() * 9)
                columna = Math.floor(Math.random() * 9)
                num = Math.floor(Math.random() * 9) + 1
            } while (nuevoTablero[fila][columna] !== null || !esMovimientoValido(nuevoTablero, fila, columna, num))
            nuevoTablero[fila][columna] = num
        }

        setTablero(nuevoTablero)
        setTableroInicial(JSON.parse(JSON.stringify(nuevoTablero)))
        setHistorial([nuevoTablero])
        setErrores(new Set())
        setTemporizador(0)
        setEnEjecucion(true)
        setProgreso(0)
    }, [dificultad])

    useEffect(() => {
        generarSudoku()
    }, [generarSudoku])

    const manejarClicCelda = (fila: number, columna: number) => {
        setCeldaSeleccionada([fila, columna])
    }

    const manejarTeclaPresionada = (e: React.KeyboardEvent) => {
        if (!celdaSeleccionada) return

        const [fila, columna] = celdaSeleccionada

        if (e.key === 'ArrowUp' && fila > 0) setCeldaSeleccionada([fila - 1, columna])
        if (e.key === 'ArrowDown' && fila < 8) setCeldaSeleccionada([fila + 1, columna])
        if (e.key === 'ArrowLeft' && columna > 0) setCeldaSeleccionada([fila, columna - 1])
        if (e.key === 'ArrowRight' && columna < 8) setCeldaSeleccionada([fila, columna + 1])

        if (/^[1-9]$/.test(e.key)) {
            manejarEntradaNumero(parseInt(e.key))
        }
    }

    const manejarEntradaNumero = (num: number) => {
        if (!celdaSeleccionada) return
        const [fila, columna] = celdaSeleccionada

        if (tableroInicial[fila][columna] !== null) return

        const nuevoTablero = tablero.map(fila => [...fila])
        nuevoTablero[fila][columna] = num

        const nuevosErrores = new Set(errores)
        if (!esMovimientoValido(nuevoTablero, fila, columna, num)) {
            nuevosErrores.add(`${fila},${columna}`)
        } else {
            nuevosErrores.delete(`${fila},${columna}`)
        }

        setTablero(nuevoTablero)
        setHistorial([...historial, nuevoTablero])
        setErrores(nuevosErrores)

        if (esTableroCompleto(nuevoTablero) && nuevosErrores.size === 0) {
            setEnEjecucion(false)
            confetti()
            toast({
                title: "¡Felicidades!",
                description: "Has completado el Sudoku correctamente.",
            })
        }
    }

    const esTableroCompleto = (tablero: TableroSudoku): boolean => {
        return tablero.every(fila => fila.every(celda => celda !== null))
    }

    const manejarDeshacer = () => {
        if (historial.length > 1) {
            const nuevoHistorial = historial.slice(0, -1)
            setTablero(nuevoHistorial[nuevoHistorial.length - 1])
            setHistorial(nuevoHistorial)
        }
    }

    const manejarReiniciar = () => {
        setTablero(JSON.parse(JSON.stringify(tableroInicial)))
        setHistorial([tableroInicial])
        setErrores(new Set())
        setTemporizador(0)
        setEnEjecucion(true)
        setProgreso(0)
    }

    const manejarGuardar = () => {
        localStorage.setItem('juegoSudoku', JSON.stringify({ tablero, tableroInicial, temporizador, dificultad }))
        toast({
            title: "Juego guardado",
            description: "Tu progreso ha sido guardado correctamente.",
        })
    }

    const manejarCargar = () => {
        const juegoGuardado = localStorage.getItem('juegoSudoku')
        if (juegoGuardado) {
            const { tablero, tableroInicial, temporizador, dificultad } = JSON.parse(juegoGuardado)
            setTablero(tablero)
            setTableroInicial(tableroInicial)
            setTemporizador(temporizador)
            setDificultad(dificultad)
            setEnEjecucion(true)
            toast({
                title: "Juego cargado",
                description: "Tu juego guardado ha sido cargado correctamente.",
            })
        } else {
            toast({
                title: "Error",
                description: "No se encontró ningún juego guardado.",
                variant: "destructive",
            })
        }
    }

    const formatearTiempo = (tiempo: number): string => {
        const minutos = Math.floor(tiempo / 60)
        const segundos = tiempo % 60
        return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
    }

    const mostrarPista = () => {
        setMostrandoPista(true)
        setTimeout(() => setMostrandoPista(false), 2000)

        for (let fila = 0; fila < 9; fila++) {
            for (let columna = 0; columna < 9; columna++) {
                if (tablero[fila][columna] === null) {
                    for (let num = 1; num <= 9; num++) {
                        if (esMovimientoValido(tablero, fila, columna, num)) {
                            toast({
                                title: "Pista",
                                description: `Prueba con el número ${num} en la fila ${fila + 1}, columna ${columna + 1}.`,
                            })
                            return
                        }
                    }
                }
            }
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ease-in-out bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-3xl font-bold">Sudoku Maritza</CardTitle>
                    <div className="flex items-center space-x-4">
                        <span className="text-lg font-semibold">{formatearTiempo(temporizador)}</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Switch checked={modoOscuro} onCheckedChange={setModoOscuro} />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Cambiar modo oscuro</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {modoOscuro ? <Moon className="text-gray-300" /> : <Sun className="text-yellow-500" />}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                        <Progress value={progreso} className="w-2/3" />
                        <span className="text-sm font-medium">{progreso}% completado</span>
                    </div>

                    <motion.div
                        ref={tableroRef}
                        className="grid grid-cols-9 gap-1 aspect-square"
                        tabIndex={0}
                        onKeyDown={manejarTeclaPresionada}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <AnimatePresence>
                            {tablero.map((fila, indiceFila) =>
                                fila.map((celda, indiceColumna) => (
                                    <motion.div
                                        key={`${indiceFila}-${indiceColumna}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.2 }}
                                        className={`
                      flex items-center justify-center
                      text-2xl font-semibold
                      border border-gray-300 dark:border-gray-600
                      ${(indiceFila + 1) % 3 === 0 && indiceColumna !== 8 ? 'border-b-4' : ''}
                      ${(indiceColumna + 1) % 3 === 0 && indiceFila !== 8 ? 'border-r-4' : ''}
                      ${celdaSeleccionada && celdaSeleccionada[0] === indiceFila && celdaSeleccionada[1] === indiceColumna
                                                ? 'bg-blue-200 dark:bg-blue-900'
                                                : 'bg-white dark:bg-gray-700'}
                      ${errores.has(`${indiceFila},${indiceColumna}`) ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}
                      ${tableroInicial[indiceFila][indiceColumna] !== null ? 'font-bold' : ''}
                      ${mostrandoPista && tablero[indiceFila][indiceColumna] === null ? 'bg-yellow-200 dark:bg-yellow-900' : ''}
                      transition-colors duration-300 ease-in-out
                      cursor-pointer
                      hover:bg-gray-100 dark:hover:bg-gray-600
                    `}
                                        onClick={() => manejarClicCelda(indiceFila, indiceColumna)}
                                    >
                                        {celda || ''}
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <Button
                                key={num}
                                onClick={() => manejarEntradaNumero(num)}
                                className="text-xl font-semibold"
                            >
                                {num}
                            </Button>
                        ))}s
                    </div>

                    <div className="flex justify-between">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={manejarDeshacer} variant="outline" size="icon">
                                        <Undo className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Deshacer</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={manejarReiniciar} variant="outline" size="icon">
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Reiniciar</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={manejarGuardar} variant="outline" size="icon">
                                        <Save className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Guardar</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={manejarCargar} variant="outline" size="icon">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Cargar</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => setEnEjecucion(!enEjecucion)} variant="outline" size="icon">
                                        {enEjecucion ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{enEjecucion ? 'Pausar' : 'Reanudar'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <div className="flex justify-between items-center">
                        <Select value={dificultad} onValueChange={(value: keyof typeof NIVELES_DIFICULTAD) => setDificultad(value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Seleccionar dificultad" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(NIVELES_DIFICULTAD).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>{value.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={generarSudoku}>Nuevo Juego</Button>
                    </div>

                    <Button
                        className="w-full flex items-center justify-center"
                        variant="secondary"
                        onClick={mostrarPista}
                    >
                        <HelpCircle className="mr-2 h-4 w-4" /> Mostrar Pista
                    </Button>

                    <div className="space-y-2">
                        <label htmlFor="volumen" className="text-sm font-medium">
                            Volumen de sonido: {volumenSonido}%
                        </label>
                        <Slider
                            id="volumen"
                            min={0}
                            max={100}
                            step={1}
                            value={[volumenSonido]}
                            onValueChange={(value) => setVolumenSonido(value[0])}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}