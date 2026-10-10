import { AnimatePresence, motion } from 'motion/react'
import { useApp } from './lib/AppContext'
import { LandingPage } from './pages/LandingPage'
import { UploadPage } from './pages/UploadPage'
import { ContractPage } from './pages/ContractPage'
import { VerifyProgressPage } from './pages/VerifyProgressPage'
import { ResultsPage } from './pages/ResultsPage'
import { UnexplainedPage } from './pages/UnexplainedPage'
import { EvidencePage } from './pages/EvidencePage'
import { RepairPage } from './pages/RepairPage'
import { ReverifyPage } from './pages/ReverifyPage'
import { SuccessPage } from './pages/SuccessPage'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const pageTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
}

export default function App() {
  const { step } = useApp()

  const renderPage = () => {
    switch (step) {
      case 'landing':     return <LandingPage key="landing" />
      case 'upload':      return <UploadPage key="upload" />
      case 'contract':    return <ContractPage key="contract" />
      case 'verifying':   return <VerifyProgressPage key="verifying" />
      case 'results':     return <ResultsPage key="results" />
      case 'unexplained': return <UnexplainedPage key="unexplained" />
      case 'evidence':    return <EvidencePage key="evidence" />
      case 'repair':      return <RepairPage key="repair" />
      case 'reverify':    return <ReverifyPage key="reverify" />
      case 'success':     return <SuccessPage key="success" />
      default:            return <LandingPage key="landing" />
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={pageTransition}
      >
        {renderPage()}
      </motion.div>
    </AnimatePresence>
  )
}
