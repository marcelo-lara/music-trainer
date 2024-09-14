import React, { useEffect, useState } from 'react';
import Vex from 'vexflow';
import './App.css'; // For custom styles

function App() {
  const [randomNote, setRandomNote] = useState(null);

  useEffect(() => {
    if (randomNote) {
      const VF = Vex.Flow;
      const div = document.getElementById("staff");
  
      // Clear the previous SVG content (in case of re-renders)
      div.innerHTML = "";
  
      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
      renderer.resize(500, 400); // Adjust height for both treble and bass staves
  
      const context = renderer.getContext();
  
      // Treble Clef (Top stave)
      const trebleStave = new VF.Stave(10, 40, 400);
      trebleStave.addClef("treble").addTimeSignature("4/4");
      trebleStave.setContext(context).draw();
  
      // Bass Clef (Bottom stave)
      const bassStave = new VF.Stave(10, 140, 400);
      bassStave.addClef("bass").addTimeSignature("4/4");
      bassStave.setContext(context).draw();
  
      // Determine clef based on the octave in the randomNote
      const [noteName, octave] = randomNote.split("/");
  
      let clef = "";
      if (parseInt(octave) >= 4) {
        clef = "treble"; // Use treble clef for octave 4 and above
      } else {
        clef = "bass"; // Use bass clef for octave 3 and below
      }
  
      // Create a StaveNote object with the random note
      const note = new VF.StaveNote({
        clef: clef,
        keys: [randomNote],
        duration: "q"
      });
  
      // Add rests to fill the measure (4 beats total in 4/4 for both staves)
      const rest1 = new VF.StaveNote({
        clef: clef,
        keys: ["b/4"],
        duration: "qr"
      });
  
      const rest2 = new VF.StaveNote({
        clef: clef,
        keys: ["b/4"],
        duration: "qr"
      });
  
      const rest3 = new VF.StaveNote({
        clef: clef,
        keys: ["b/4"],
        duration: "qr"
      });
  
      const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
      voice.addTickables([note, rest1, rest2, rest3]);
  
      // Format and justify the notes to 400 pixels
      const formatter = new VF.Formatter()
        .joinVoices([voice])
        .format([voice], 400);
  
      // Render the voice on the appropriate stave
      if (clef === "treble") {
        voice.draw(context, trebleStave);
      } else {
        voice.draw(context, bassStave);
      }
  
      // Draw a brace to connect the treble and bass staves
      const brace = new VF.StaveConnector(trebleStave, bassStave);
      brace.setType(VF.StaveConnector.type.BRACE);
      brace.setContext(context).draw();
  
      // Draw the vertical bar to connect the staves
      const lineLeft = new VF.StaveConnector(trebleStave, bassStave);
      lineLeft.setType(VF.StaveConnector.type.SINGLE_LEFT);
      lineLeft.setContext(context).draw();
  
      // Draw the right bar at the end of both staves
      const lineRight = new VF.StaveConnector(trebleStave, bassStave);
      lineRight.setType(VF.StaveConnector.type.SINGLE_RIGHT);
      lineRight.setContext(context).draw();
    }
  }, [randomNote]);

  // Function to generate a random note from C4 to C6
  const generateRandomNote = () => {
    const notes = [];
    const noteNames = ["c", "d", "e", "f", "g", "a", "b"];
    
    for (let octave = 2; octave <= 6; octave++) {
      for (let i = 0; i < noteNames.length; i++) {
        notes.push(`${noteNames[i]}/${octave}`);
      }
    }

    const randomIndex = Math.floor(Math.random() * notes.length);
    setRandomNote(notes[randomIndex]);
  };

  return (
    <div className="App">
      <h1>Music Trainer</h1>
      <button onClick={generateRandomNote}>Generate Random Note</button>
      <div className="staff-container">
        <div id="staff"></div>
      </div>
    </div>
  );
}

export default App;
