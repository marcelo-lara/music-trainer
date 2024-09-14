import React, { useEffect } from 'react';
import Vex from 'vexflow';
import './App.css'; // For custom styles

function App() {
  useEffect(() => {
    const VF = Vex.Flow;
    const div = document.getElementById("staff");

    // Clear the previous SVG content (in case of re-renders)
    div.innerHTML = "";

    const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
    renderer.resize(500, 300);  // Adjust height for two staves (treble and bass)

    const context = renderer.getContext();

    // Treble Clef (Top stave)
    const trebleStave = new VF.Stave(10, 40, 400);
    trebleStave.addClef("treble").addTimeSignature("4/4");
    trebleStave.setContext(context).draw();

    // Bass Clef (Bottom stave)
    const bassStave = new VF.Stave(10, 140, 400);
    bassStave.addClef("bass").addTimeSignature("4/4");
    bassStave.setContext(context).draw();

    // Connect the two staves with a brace (for Grand Staff)
    const brace = new VF.StaveConnector(trebleStave, bassStave).setType(VF.StaveConnector.type.BRACE);
    brace.setContext(context).draw();

    // Draw bar lines between the staves
    const lineLeft = new VF.StaveConnector(trebleStave, bassStave).setType(VF.StaveConnector.type.SINGLE_LEFT);
    const lineRight = new VF.StaveConnector(trebleStave, bassStave).setType(VF.StaveConnector.type.SINGLE_RIGHT);
    lineLeft.setContext(context).draw();
    lineRight.setContext(context).draw();
  }, []);

  return (
    <div className="App">
      <h1>Music Trainer</h1>
      <div className="staff-container">
        <div id="staff"></div>
      </div>
    </div>
  );
}

export default App;
