import {
  BackgroundPaths,
  AnimatedBackground,
  BackgroundStripes,
  Navbar,
  Hero,
  HowWeWork,
  InnovativeServices,
  ROICalculatorHome,
  AnimatedFooter,
  MouseMoveEffect,
} from "@/components/landing"

export default function Index() {
  return (
    <div className="relative min-h-screen bg-black">
      <MouseMoveEffect />
      <BackgroundPaths />
      <AnimatedBackground />
      <BackgroundStripes />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <HowWeWork />
        <InnovativeServices />
        <ROICalculatorHome />
        <AnimatedFooter />
      </div>
    </div>
  )
}
