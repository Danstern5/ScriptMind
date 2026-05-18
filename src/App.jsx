import ScriptMind from './ScriptMind'
import { DemoProvider } from './demo/demoState.jsx'

export default function App() {
  return (
    <DemoProvider>
      <ScriptMind />
    </DemoProvider>
  )
}
