import React, { useEffect, useState, useCallback } from "react";
import Vex from "vexflow";
import './App.css';

const MusicTrainer = () => {
  const [randomNote, setRandomNote] = useState("");
  const [midiNote, setMidiNote] = useState(null);
  const [isNoteCorrect, setIsNoteCorrect] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [showGeneratedNote, setShowGeneratedNote] = useState(false);
  const notes = [];

  // Generate all notes from C2 to B6
  const noteNames = ["c", "d", "e", "f", "g", "a", "b"];
  for (let octave = 2; octave <= 5; octave++) {
    for (let i = 0; i < noteNames.length; i++) {
      notes.push(`${noteNames[i]}/${octave}`);
    }
  }

  // Generate a random note function
  const generateRandomNote = () => {
    const randomIndex = Math.floor(Math.random() * notes.length);
    const newNote = notes[randomIndex];
    setRandomNote(newNote);  // Set the random note
  
    setAttempts(0);
    setShowGeneratedNote(false);
  };

  // MIDI Input handler wrapped in useCallback to prevent unnecessary re-creations
  const handleMIDIInput = useCallback((midiAccess) => {
    const inputs = midiAccess.inputs.values();
    for (let input of inputs) {
      input.onmidimessage = handleMIDIMessage;
    }
  }, []);

  const handleMIDIMessage = (message) => {
    const [status, note, velocity] = message.data;
    if (status === 146 && velocity > 0) {
      setMidiNote(convertMIDINoteToNoteName(note));  // Store the MIDI note in state
    }
  };

  const convertMIDINoteToNoteName = (midiNoteNumber) => {
    const noteNames = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
    const octave = Math.floor(midiNoteNumber / 12) - 1;
    const noteIndex = midiNoteNumber % 12;
    return `${noteNames[noteIndex]}/${octave}`;
  };

useEffect(() => {

  if(!midiNote) return;
  
  if (midiNote === randomNote) {
    console.log("Correct!");
    setIsNoteCorrect(true);  // Mark as correct
    setAttempts(0);          // Reset attempts
    generateRandomNote();    // Generate a new random note
  } else {
    console.log("incorrect...", midiNote, randomNote);
    setIsNoteCorrect(false); // Mark as incorrect
    setAttempts((prev) => prev + 1); // Increment incorrect attempt counter
  }

  
}, [midiNote]);


  useEffect(() => {
    // Set up Web MIDI API
    if (navigator.requestMIDIAccess) {
      console.log("Requesting MIDI Access...");
      navigator.requestMIDIAccess().then(handleMIDIInput).catch(console.error);
    } else {
      console.error("Web MIDI API is not supported in this browser.");
    }
  }, [handleMIDIInput]);

  // This will run every time randomNote changes
  useEffect(() => {
    if (randomNote) {
      console.log("New randomNote is set: ", randomNote);
    }
  }, [randomNote]);  

  // Render the music stave (as already defined in your app)
  useEffect(() => {
    if (randomNote) {
      const VF = Vex.Flow;
      const div = document.getElementById("staff");

      // Clear previous SVG content
      div.innerHTML = "";

      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
      renderer.resize(500, 400);

      const context = renderer.getContext();

      // Treble Clef
      const trebleStave = new VF.Stave(10, 40, 400);
      trebleStave.addClef("treble").addTimeSignature("4/4");
      trebleStave.setContext(context).draw();

      // Bass Clef
      const bassStave = new VF.Stave(10, 140, 400);
      bassStave.addClef("bass").addTimeSignature("4/4");
      bassStave.setContext(context).draw();

      // Determine the clef based on the octave of randomNote
      const [, octave] = randomNote.split("/");
      let clef = parseInt(octave) >= 4 ? "treble" : "bass";

      // Create a StaveNote for the random note
      const note = new VF.StaveNote({
        clef: clef,
        keys: [randomNote],
        duration: "q",
      });

      // Add rests to fill measure
      const rest = new VF.StaveNote({
        clef: clef,
        keys: ["b/4"],
        duration: "qr",
      });

      const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
      voice.addTickables([note, rest, rest, rest]);

      // Format and justify the notes to 400 pixels
      new VF.Formatter().joinVoices([voice]).format([voice], 400);

      // Draw notes on appropriate stave
      if (clef === "treble") {
        voice.draw(context, trebleStave);
      } else {
        voice.draw(context, bassStave);
      }

      // Draw a brace and connectors between the two staves
      const brace = new VF.StaveConnector(trebleStave, bassStave);
      brace.setType(VF.StaveConnector.type.BRACE);
      brace.setContext(context).draw();

      const lineLeft = new VF.StaveConnector(trebleStave, bassStave);
      lineLeft.setType(VF.StaveConnector.type.SINGLE_LEFT);
      lineLeft.setContext(context).draw();

      const lineRight = new VF.StaveConnector(trebleStave, bassStave);
      lineRight.setType(VF.StaveConnector.type.SINGLE_RIGHT);
      lineRight.setContext(context).draw();
    }
  }, [randomNote]);

  useEffect(() => {
    if (attempts >= 3) {
      setShowGeneratedNote(true); // Show the generated note after 3 attempts
    }
  }, [attempts]);

  useEffect(() => {
    generateRandomNote();  // Generate the first random note when the component mounts
  }, []);

  return (
    <div>
      <h1>Music Trainer</h1>
      {/* <button onClick={generateRandomNote}>Generate Random Note</button> */}
      <div id="staff"></div>

      {/* Display MIDI note, color red if incorrect */}
      <div className={`midi-note ${isNoteCorrect === false ? 'incorrect' : ''}`}>
        {midiNote && <p>Last MIDI Note Played: {midiNote}</p>}
        {/* After 3 attempts, display the generated note */}
        {showGeneratedNote && <p className="generated-note">Note: {randomNote}</p>}
      </div>
    </div>
  );
};

export default MusicTrainer;
