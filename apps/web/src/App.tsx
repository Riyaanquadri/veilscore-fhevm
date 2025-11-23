import React, { useState } from "react";
import InputForm from "./components/InputForm";
import DebugTfhe from "./pages/DebugTfhe";

function App() {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="app-shell">
      <button 
        onClick={() => setShowDebug(!showDebug)}
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 1000,
          padding: '8px 16px',
          backgroundColor: showDebug ? '#ff6b6b' : '#4c6ef5',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        {showDebug ? 'Close Debug' : 'Open Debug'}
      </button>
      {showDebug ? <DebugTfhe /> : <InputForm />}
    </div>
  );
}

export default App;
