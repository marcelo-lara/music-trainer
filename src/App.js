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

      // Create a StaveNote object with the random note (on treble for now)
      const note = new VF.StaveNote({
        clef: "treble",
        keys: [randomNote],
        duration: "q"
      });

      // Add rests to fill the measure (4 beats total in 4/4 for the treble stave)
      const rest1 = new VF.StaveNote({
        clef: "treble",
        keys: ["b/4"],
        duration: "qr"
      });

      const rest2 = new VF.StaveNote({
        clef: "treble",
        keys: ["b/4"],
        duration: "qr"
      });

      const rest3 = new VF.StaveNote({
        clef: "treble",
        keys: ["b/4"],
        duration: "qr"
      });

      // Create a voice in 4/4 and add the note and rests to the treble stave
      const trebleVoice = new VF.Voice({ num_beats: 4, beat_value: 4 });
      trebleVoice.addTickables([note, rest1, rest2, rest3]);

      // Create rests for the bass stave (for now it's just rests)
      const bassRest1 = new VF.StaveNote({
        clef: "bass",
        keys: ["d/3"],
        duration: "qr"
      });

      const bassRest2 = new VF.StaveNote({
        clef: "bass",
        keys: ["d/3"],
        duration: "qr"
      });

      const bassRest3 = new VF.StaveNote({
        clef: "bass",
        keys: ["d/3"],
        duration: "qr"
      });

      const bassRest4 = new VF.StaveNote({
        clef: "bass",
        keys: ["d/3"],
        duration: "qr"
      });

      const bassVoice = new VF.Voice({ num_beats: 4, beat_value: 4 });
      bassVoice.addTickables([bassRest1, bassRest2, bassRest3, bassRest4]);

      // Format and justify the notes to 400 pixels
      const formatter = new VF.Formatter()
        .joinVoices([trebleVoice])
        .format([trebleVoice], 400);

      const bassFormatter = new VF.Formatter()
        .joinVoices([bassVoice])
        .format([bassVoice], 400);

      // Render both voices
      trebleVoice.draw(context, trebleStave);
      bassVoice.draw(context, bassStave);

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
    const notes = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5", "d/5", "e/5", "f/5", "g/5", "a/5", "b/5", "c/6"];
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
