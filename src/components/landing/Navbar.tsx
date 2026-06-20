import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import AnimatedButton from "./AnimatedButton"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl">
      <motion.nav
        className="relative bg-gray-900/60 backdrop-blur-md border rounded-2xl shadow-lg overflow-hidden"
        animate={{
          borderColor: [
            "rgba(59, 130, 246, 0.3)",
            "rgba(147, 51, 234, 0.3)",
            "rgba(236, 72, 153, 0.3)",
            "rgba(34, 197, 94, 0.3)",
            "rgba(59, 130, 246, 0.3)",
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Animated border glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{
            boxShadow: [
              "0 0 20px rgba(59, 130, 246, 0.2)",
              "0 0 20px rgba(147, 51, 234, 0.2)",
              "0 0 20px rgba(236, 72, 153, 0.2)",
              "0 0 20px rgba(34, 197, 94, 0.2)",
              "0 0 20px rgba(59, 130, 246, 0.2)",
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="relative z-10 px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="flex items-center space-x-3">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Pulse Digital
                </span>
              </a>
            </div>

            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                <a href="#services" className="text-sm text-gray-300 hover:text-blue-400 transition-colors">
                  Услуги
                </a>
                <a href="#artists" className="text-sm text-gray-300 hover:text-purple-400 transition-colors">
                  Клиенты
                </a>
                <a href="#success-stories" className="text-sm text-gray-300 hover:text-green-400 transition-colors">
                  Кейсы
                </a>
                <a href="#contact" className="text-sm text-gray-300 hover:text-orange-400 transition-colors">
                  Контакты
                </a>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" className="text-sm text-gray-300 hover:text-white">
                Войти
              </Button>
              <a href="#get-started">
                <AnimatedButton size="sm" className="bg-white text-black hover:bg-gray-100">
                  Начать
                </AnimatedButton>
              </a>
            </div>

            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-5 w-5 text-gray-300" /> : <Menu className="h-5 w-5 text-gray-300" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-700/50 bg-gray-900/80 backdrop-blur-md rounded-b-2xl">
            <div className="px-6 py-4 space-y-3">
              <a href="#services" className="block text-gray-300 hover:text-blue-400">
                Услуги
              </a>
              <a href="#artists" className="block text-gray-300 hover:text-purple-400">
                Клиенты
              </a>
              <a href="#success-stories" className="block text-gray-300 hover:text-green-400">
                Кейсы
              </a>
              <a href="#contact" className="block text-gray-300 hover:text-orange-400">
                Контакты
              </a>
              <div className="pt-3 border-t border-gray-700">
                <a href="#get-started" className="block">
                  <AnimatedButton className="w-full bg-white text-black hover:bg-gray-100">Начать</AnimatedButton>
                </a>
              </div>
            </div>
          </div>
        )}
      </motion.nav>
    </header>
  )
}
