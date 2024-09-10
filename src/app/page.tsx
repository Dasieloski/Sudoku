"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { Undo, RotateCcw, HelpCircle, Save, Upload, VolumeX, Volume2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'

// Tipos
type Cell = number | null
type Board = Cell[][]
type Difficulty = 'fácil' | 'medio' | 'difícil'
type ColorTheme = 'light' | 'dark' | 'violet' | 'orange' | 'blue'

// Colores personalizados
const colorThemes = {
  light: {
    background: 'bg-white',
    text: 'text-gray-800',
    accent: 'bg-orange-500',
    accentHover: 'hover:bg-orange-600',
    cellBackground: 'bg-gray-100',
    cellBackgroundHover: 'hover:bg-gray-200',
    cellBorder: 'border-gray-300',
    error: 'bg-red-200',
    shadow: 'shadow-gray-400',
  },
  dark: {
    background: 'bg-gray-900',
    text: 'text-gray-100',
    accent: 'bg-orange-600',
    accentHover: 'hover:bg-orange-700',
    cellBackground: 'bg-gray-800',
    cellBackgroundHover: 'hover:bg-gray-700',
    cellBorder: 'border-gray-600',
    error: 'bg-red-900',
    shadow: 'shadow-gray-700',
  },
  violet: {
    background: 'bg-purple-100',
    text: 'text-purple-900',
    accent: 'bg-purple-500',
    accentHover: 'hover:bg-purple-600',
    cellBackground: 'bg-purple-200',
    cellBackgroundHover: 'hover:bg-purple-300',
    cellBorder: 'border-purple-400',
    error: 'bg-red-300',
    shadow: 'shadow-purple-400',
  },
  orange: {
    background: 'bg-orange-100',
    text: 'text-orange-900',
    accent: 'bg-orange-500',
    accentHover: 'hover:bg-orange-600',
    cellBackground: 'bg-orange-200',
    cellBackgroundHover: 'hover:bg-orange-300',
    cellBorder: 'border-orange-400',
    error: 'bg-red-300',
    shadow: 'shadow-orange-400',
  },
  blue: {
    background: 'bg-blue-100',
    text: 'text-blue-900',
    accent: 'bg-blue-500',
    accentHover: 'hover:bg-blue-600',
    cellBackground: 'bg-blue-200',
    cellBackgroundHover: 'hover:bg-blue-300',
    cellBorder: 'border-blue-400',
    error: 'bg-red-300',
    shadow: 'shadow-blue-400',
  },
}

// Algoritmo de generación de Sudoku usando backtracking
const generateSudoku = (difficulty: Difficulty): Board => {
  const board: Board = Array(9).fill(null).map(() => Array(9).fill(null))

  const fillBoard = (board: Board): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === null) {
          for (let num = 1; num <= 9; num++) {
            if (isValidMove(board, row, col, num)) {
              board[row][col] = num
              if (fillBoard(board)) {
                return true
              }
              board[row][col] = null
            }
          }
          return false
        }
      }
    }
    return true
  }

  fillBoard(board)

  // Eliminar números según la dificultad
  const cellsToRemove = difficulty === 'fácil' ? 40 : difficulty === 'medio' ? 50 : 60
  for (let i = 0; i < cellsToRemove; i++) {
    let row, col
    do {
      row = Math.floor(Math.random() * 9)
      col = Math.floor(Math.random() * 9)
    } while (board[row][col] === null)
    board[row][col] = null
  }

  return board
}

// Función para validar un movimiento
const isValidMove = (board: Board, row: number, col: number, num: number): boolean => {
  // Comprobar fila y columna
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num || board[x][col] === num) {
      return false
    }
  }

  // Comprobar bloque 3x3
  const startRow = Math.floor(row / 3) * 3
  const startCol = Math.floor(col / 3) * 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) {
        return false
      }
    }
  }

  return true
}

// Componente principal del Sudoku
export default function Sudoku() {
  const [board, setBoard] = useState<Board>(() => generateSudoku('fácil'))
  const [initialBoard, setInitialBoard] = useState<Board>(() => JSON.parse(JSON.stringify(board)))
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('fácil')
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [history, setHistory] = useState<Board[]>([])
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false)
  const [colorTheme, setColorTheme] = useState<ColorTheme>('light')
  const { setTheme } = useTheme()
  const audioRef = useRef<HTMLAudioElement>(null)

  // Efecto para el temporizador
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  // Función para iniciar un nuevo juego
  const newGame = useCallback(() => {
    const newBoard = generateSudoku(difficulty)
    setBoard(newBoard)
    setInitialBoard(JSON.parse(JSON.stringify(newBoard)))
    setErrors(new Set())
    setHistory([])
    setTimer(0)
    setIsRunning(true)
  }, [difficulty])

  // Efecto para iniciar un nuevo juego cuando cambia la dificultad
  useEffect(() => {
    newGame()
  }, [difficulty, newGame])

  // Función para manejar la entrada de números
  const handleNumberInput = (num: number) => {
    if (!selectedCell) return

    const [row, col] = selectedCell
    if (initialBoard[row][col] !== null) return

    const newBoard = board.map(row => [...row])
    newBoard[row][col] = num

    setBoard(newBoard)
    setHistory([...history, JSON.parse(JSON.stringify(board))])

    // Validar el movimiento
    const newErrors = new Set(errors)
    if (!isValidMove(newBoard, row, col, num)) {
      newErrors.add(`${row},${col}`)
    } else {
      newErrors.delete(`${row},${col}`)
    }
    setErrors(newErrors)

    // Reproducir sonido
    if (soundEnabled && audioRef.current) {
      audioRef.current.play()
    }

    // Comprobar si el juego ha terminado
    if (isBoardComplete(newBoard)) {
      setIsRunning(false)
      confetti()
    }
  }

  // Función para comprobar si el tablero está completo
  const isBoardComplete = (board: Board): boolean => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === null || !isValidMove(board, i, j, board[i][j]!)) {
          return false
        }
      }
    }
    return true
  }

  // Función para deshacer el último movimiento
  const undoMove = () => {
    if (history.length > 0) {
      const previousBoard = history.pop()!
      setBoard(previousBoard)
      setHistory([...history])
    }
  }

  // Función para reiniciar el juego
  const resetGame = () => {
    setBoard(JSON.parse(JSON.stringify(initialBoard)))
    setErrors(new Set())
    setHistory([])
    setTimer(0)
    setIsRunning(true)
  }

  // Función para guardar el juego
  const saveGame = () => {
    const gameState = {
      board,
      initialBoard,
      difficulty,
      timer,
      colorTheme
    }
    localStorage.setItem('sudokuGameState', JSON.stringify(gameState))
  }

  // Función para cargar el juego
  const loadGame = () => {
    const savedState = localStorage.getItem('sudokuGameState')
    if (savedState) {
      const { board, initialBoard, difficulty, timer, colorTheme } = JSON.parse(savedState)
      setBoard(board)
      setInitialBoard(initialBoard)
      setDifficulty(difficulty)
      setTimer(timer)
      setColorTheme(colorTheme)
      setIsRunning(true)
    }
  }

  // Renderizado del tablero de Sudoku
  const renderBoard = () => {
    return (
      <motion.div
        className={`grid grid-cols-9 gap-0.5 ${colorThemes[colorTheme].cellBorder} p-0.5 rounded-lg shadow-lg`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className={`
                w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center
                text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold cursor-pointer transition-all duration-200 ease-in-out
                ${rowIndex % 3 === 2 && rowIndex !== 8 ? `border-b-2 ${colorThemes[colorTheme].shadow}` : ''}
                ${colIndex % 3 === 2 && colIndex !== 8 ? `border-r-2 ${colorThemes[colorTheme].shadow}` : ''}
                ${selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex
                  ? colorThemes[colorTheme].accent
                  : colorThemes[colorTheme].cellBackground}
                ${colorThemes[colorTheme].cellBackgroundHover}
                ${errors.has(`${rowIndex},${colIndex}`) ? colorThemes[colorTheme].error : ''}
                ${initialBoard[rowIndex][colIndex] !== null ? 'font-bold' : ''}
              `}
              onClick={() => {
                setSelectedCell([rowIndex, colIndex])
                setShowVirtualKeyboard(true)
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cell !== null ? cell : ''}
            </motion.div>
          ))
        )}
      </motion.div>
    )
  }

  // Renderizado del teclado numérico virtual
  const renderVirtualKeyboard = () => {
    if (!showVirtualKeyboard) return null

    return (
      <motion.div
        className={`grid grid-cols-3 gap-2 mt-4 ${colorThemes[colorTheme].background} w-full max-w-xs mx-auto`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <motion.button
            key={num}
            onClick={() => handleNumberInput(num)}
            className={`w-full h-8 sm:h-10 text-base sm:text-lg font-semibold rounded-full ${colorThemes[colorTheme].accent} ${colorThemes[colorTheme].accentHover}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {num}
          </motion.button>
        ))}
      </motion.div>
    )
  }

  // Manejo de eventos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key))
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (selectedCell) {
          const [row, col] = selectedCell
          let newRow = row
          let newCol = col
          if (e.key === 'ArrowUp') newRow = (row - 1 + 9) % 9
          if (e.key === 'ArrowDown') newRow = (row + 1) % 9
          if (e.key === 'ArrowLeft') newCol = (col - 1 + 9) % 9
          if (e.key === 'ArrowRight') newCol = (col + 1) % 9
          setSelectedCell([newRow, newCol])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCell, handleNumberInput])

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${colorThemes[colorTheme].background} ${colorThemes[colorTheme].text} transition-colors duration-300`}>
      <div className="w-full max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Sudoku Maritza</h1>
        <motion.div
          className="flex justify-between items-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fácil">Fácil</SelectItem>
              <SelectItem value="medio">Medio</SelectItem>
              <SelectItem value="difícil">Difícil</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xl font-semibold">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
          <Select value={colorTheme} onValueChange={(value: ColorTheme) => {
            setColorTheme(value)
            setTheme(value)
          }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Oscuro</SelectItem>
              <SelectItem value="violet">Violeta</SelectItem>
              <SelectItem value="orange">Anaranjado</SelectItem>
              <SelectItem value="blue">Azul</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
        <div className="flex justify-center mb-6">
          {renderBoard()}
        </div>
        <AnimatePresence>
          {renderVirtualKeyboard()}
        </AnimatePresence>
        <motion.div
          className="flex justify-center mt-4 space-x-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Button onClick={undoMove} className={`flex items-center ${colorThemes[colorTheme].accent} ${colorThemes[colorTheme].accentHover}`}>
            <Undo className="w-4 h-4 mr-2" />
            Deshacer
          </Button>
          <Button onClick={resetGame} className={`flex items-center ${colorThemes[colorTheme].accent} ${colorThemes[colorTheme].accentHover}`}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
          <Button onClick={() => setShowHelp(!showHelp)} className={`flex items-center ${colorThemes[colorTheme].accent} ${colorThemes[colorTheme].accentHover}`}>
            <HelpCircle className="w-4 h-4 mr-2" />
            Ayuda
          </Button>
        </motion.div>
        <motion.div
          className="flex justify-center mt-4 space-x-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Button onClick={saveGame} className={`flex items-center ${colorThemes[colorTheme].accent} ${colorThemes[colorTheme].accentHover}`}>
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
          <Button onClick={loadGame} className={`flex items-center ${colorThemes[colorTheme].accent} ${colorThemes[colorTheme].accentHover}`}>
            <Upload className="w-4 h-4 mr-2" />
            Cargar
          </Button>
          <Button onClick={() => setSoundEnabled(!soundEnabled)} className={`flex items-center ${colorThemes[colorTheme].accent} ${colorThemes[colorTheme].accentHover}`}>
            {soundEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
            Sonido
          </Button>
        </motion.div>
        <AnimatePresence>
          {showHelp && (
            <motion.div
              className={`mt-4 p-4 ${colorThemes[colorTheme].cellBackground} rounded-lg shadow`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-semibold mb-2">Cómo jugar:</h3>
              <ul className="list-disc list-inside">
                <li>Rellena la cuadrícula para que cada fila, columna y caja de 3x3 contenga los dígitos del 1 al 9</li>
                <li>Usa el teclado numérico o el teclado virtual para ingresar números</li>
                <li>Usa las teclas de flecha para navegar por la cuadrícula</li>
                <li>Haz clic en Deshacer para revertir el último movimiento</li>
                <li>Haz clic en Reiniciar para comenzar de nuevo</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <audio ref={audioRef} src="/click.mp3" />
    </div>
  )
}