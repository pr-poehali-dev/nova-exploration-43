import { motion } from "framer-motion"
import { useState } from "react"
import { Smartphone, BadgeCheck, ShieldCheck } from "lucide-react"

// Базовые цены iPhone (новый, идеальное состояние) — ориентир на июнь 2026, в рублях
const models = [
  { id: "iphone-13", name: "iPhone 13", base: 42000 },
  { id: "iphone-14", name: "iPhone 14", base: 52000 },
  { id: "iphone-15", name: "iPhone 15", base: 64000 },
  { id: "iphone-15-pro", name: "iPhone 15 Pro", base: 82000 },
  { id: "iphone-16", name: "iPhone 16", base: 78000 },
  { id: "iphone-16-pro", name: "iPhone 16 Pro", base: 98000 },
  { id: "iphone-16-pro-max", name: "iPhone 16 Pro Max", base: 122000 },
]

// Множитель за объём памяти
const storages = [
  { id: "128", name: "128 ГБ", multiplier: 1 },
  { id: "256", name: "256 ГБ", multiplier: 1.12 },
  { id: "512", name: "512 ГБ", multiplier: 1.28 },
  { id: "1024", name: "1 ТБ", multiplier: 1.45 },
]

// Состояние телефона
const conditions = [
  { id: "new", name: "Новый", description: "Запечатан, без вскрытия", multiplier: 1 },
  { id: "excellent", name: "Отличное", description: "Без царапин, как новый", multiplier: 0.82 },
  { id: "good", name: "Хорошее", description: "Лёгкие следы носки", multiplier: 0.68 },
  { id: "used", name: "Среднее", description: "Заметные потёртости", multiplier: 0.52 },
]

const formatRub = (num: number) => num.toLocaleString("ru-RU")

export default function ROICalculatorHome() {
  const [selectedModel, setSelectedModel] = useState("iphone-15-pro")
  const [selectedStorage, setSelectedStorage] = useState("256")
  const [selectedCondition, setSelectedCondition] = useState("excellent")
  const [batteryHealth, setBatteryHealth] = useState(92)

  const model = models.find((m) => m.id === selectedModel)!
  const storage = storages.find((s) => s.id === selectedStorage)!
  const condition = conditions.find((c) => c.id === selectedCondition)!

  // Влияние состояния аккумулятора (100% = норма, ниже 80% — заметная скидка)
  const batteryFactor = 0.85 + (batteryHealth / 100) * 0.15

  const estimate = Math.round(
    (model.base * storage.multiplier * condition.multiplier * batteryFactor) / 500
  ) * 500

  const low = Math.round((estimate * 0.93) / 500) * 500
  const high = Math.round((estimate * 1.07) / 500) * 500

  return (
    <section id="calculator" className="py-24 bg-black relative backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">Калькулятор стоимости iPhone</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Узнайте, за сколько можно продать ваш телефон. Цены актуальны на июнь 2026 года.
          </p>
        </motion.div>

        <div className="bg-gray-900/40 border border-gray-700/30 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 80%, rgba(147,51,234,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 80%, rgba(34,197,94,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 20%, rgba(249,115,22,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.1) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 15, repeat: Infinity }}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Controls */}
            <div className="space-y-8">
              {/* Model */}
              <div>
                <label className="block text-lg font-medium text-white mb-4">Модель iPhone</label>
                <div className="grid grid-cols-2 gap-3">
                  {models.map((m) => (
                    <motion.button
                      key={m.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                        selectedModel === m.id
                          ? "bg-blue-500/20 border-blue-500/50 text-white"
                          : "bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-gray-600/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${selectedModel === m.id ? "bg-blue-500/30" : "bg-gray-700/50"}`}>
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div className="font-medium text-sm">{m.name}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Storage */}
              <div>
                <label className="block text-lg font-medium text-white mb-4">Объём памяти</label>
                <div className="grid grid-cols-4 gap-3">
                  {storages.map((s) => (
                    <motion.button
                      key={s.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedStorage(s.id)}
                      className={`py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        selectedStorage === s.id
                          ? "bg-purple-500/20 border-purple-500/50 text-white"
                          : "bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-gray-600/50"
                      }`}
                    >
                      {s.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-lg font-medium text-white mb-4">Состояние</label>
                <div className="grid grid-cols-2 gap-3">
                  {conditions.map((c) => (
                    <motion.button
                      key={c.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCondition(c.id)}
                      className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                        selectedCondition === c.id
                          ? "bg-green-500/20 border-green-500/50 text-white"
                          : "bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-gray-600/50"
                      }`}
                    >
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs opacity-70">{c.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Battery */}
              <div>
                <label className="block text-lg font-medium text-white mb-4">Состояние аккумулятора</label>
                <input
                  type="range"
                  min="60"
                  max="100"
                  step="1"
                  value={batteryHealth}
                  onChange={(e) => setBatteryHealth(Number(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #22c55e 0%, #22c55e ${((batteryHealth - 60) / 40) * 100}%, #374151 ${((batteryHealth - 60) / 40) * 100}%, #374151 100%)`,
                  }}
                />
                <div className="text-center mt-4">
                  <span className="text-3xl font-bold text-white">{batteryHealth}%</span>
                  <span className="text-gray-400 ml-2">ёмкости</span>
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="flex flex-col justify-center space-y-8">
              <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-gray-700/50 rounded-3xl p-8 text-center">
                <div className="text-gray-400 text-sm mb-2">Примерная стоимость продажи</div>
                <motion.div
                  key={estimate}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3"
                >
                  {formatRub(estimate)} &#8381;
                </motion.div>
                <div className="text-gray-400 text-sm">
                  Диапазон: {formatRub(low)} — {formatRub(high)} &#8381;
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 text-center">
                  <BadgeCheck className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-300">{model.name}, {storage.name}</div>
                </div>
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 text-center">
                  <ShieldCheck className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-300">Состояние: {condition.name}</div>
                </div>
              </div>

              <a href="#get-started" className="block">
                <button className="w-full bg-white text-black hover:bg-gray-100 font-medium py-4 rounded-xl transition-colors">
                  Разместить объявление за {formatRub(estimate)} &#8381;
                </button>
              </a>

              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Оценка ориентировочная и основана на средних ценах площадки на июнь 2026 года.
                Итоговая стоимость зависит от спроса и комплектации.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
