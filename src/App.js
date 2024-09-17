import React, { useEffect, useState, useCallback, useRef } from "react";
import Vex from "vexflow";
import './App.css';

const MusicTrainer = () => {
  const [randomNote, setRandomNote] = useState("");
  const [midiNote, setMidiNote] = useState(null);
  const [isNoteCorrect, setIsNoteCorrect] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [showGeneratedNote, setShowGeneratedNote] = useState(false);
  const [correctNotes, setCorrectNotes] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [startTime, setStartTime] = useState(null); // Track start time for each note
  const [elapsedTime, setElapsedTime] = useState(0); // Track time elapsed for each guess
  const [times, setTimes] = useState([]); // Store time for each correct guess
  const [minTime, setMinTime] = useState(null); // Track the minimum time across all guesses
  const midiInitialized = useRef(false); 
  const notes = [];
  const noteOff = 144;


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
    setStartTime(Date.now()); // Set start time when new note is generated
    setAttempts(0);
    setShowGeneratedNote(false);
  };

  const handleMIDIMessage = (message) => {
    const [status, note, velocity] = message.data;
    console.log(status, note, velocity);
    if (status === noteOff && velocity > 0) { // Note On message
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
    if (!midiNote || !randomNote) return;

    setTotalAttempts((prev) => prev + 1); // Increment total attempts

    if (midiNote === randomNote) {
      const timeTaken = (Date.now() - startTime) / 1000; // Calculate elapsed time in seconds
      setElapsedTime(timeTaken);

      // Update the list of times
      setTimes((prev) => {
        const updatedTimes = [...prev, timeTaken];
        return updatedTimes.slice(-4); // Keep only the last 4 times
      });

      // Update minimum time
      if (!minTime || timeTaken < minTime) {
        setMinTime(timeTaken);
      }

      setCorrectNotes((prev) => prev + 1); // Increment correct notes
      generateRandomNote();    // Generate a new random note
    } else {
      setIsNoteCorrect(false);
      setAttempts((prev) => prev + 1); // Increment incorrect attempt counter
    }
  }, [midiNote]);

  useEffect(() => {
    if (midiInitialized.current) return;

    // Set up Web MIDI API
    if (!midiInitialized.current) {
      midiInitialized.current = true;
      navigator.requestMIDIAccess().then((midiAccess)=>{    
        const inputs = midiAccess.inputs.values();
        console.log("listening to");
        for (let input of inputs) {
          console.log(' -', input.name);
          input.onmidimessage = handleMIDIMessage;
        }

      }).catch(console.error);
    } else {
      console.error("Web MIDI API is not supported in this browser.");
    }
  }, []);

  useEffect(() => {
    if (attempts >= 3) {
      setShowGeneratedNote(true); // Show the generated note after 3 attempts
    }
  }, [attempts]);

  useEffect(() => {
    generateRandomNote();  // Generate the first random note when the component mounts
  }, []);

  // Render the staves and notes
  useEffect(() => {
    if (randomNote) {
      const VF = Vex.Flow;
      const div = document.getElementById("staff");

      // Clear previous SVG content
      while (div.firstChild) {
        div.removeChild(div.firstChild);
      }

      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
      renderer.resize(500, 400);
      const context = renderer.getContext();

      // Create the staves
      const trebleStave = new VF.Stave(10, 40, 400);
      trebleStave.addClef("treble").addTimeSignature("4/4");
      trebleStave.setContext(context).draw();

      const bassStave = new VF.Stave(10, 140, 400);
      bassStave.addClef("bass").addTimeSignature("4/4");
      bassStave.setContext(context).draw();

      // Determine the clef based on the note's octave
      const [, octave] = randomNote.split("/");
      const clef = parseInt(octave) >= 4 ? "treble" : "bass";

      // Create the note
      const note = new VF.StaveNote({
        clef: clef,
        keys: [randomNote],
        duration: "q",
      });

      // Create rests to fill the measure
      const rest = new VF.StaveNote({
        clef: clef,
        keys: ["b/4"],
        duration: "qr",
      });

      const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
      voice.addTickables([note, rest, rest, rest]);

      // Format and justify the notes to 400 pixels
      new VF.Formatter().joinVoices([voice]).format([voice], 400);

      // Draw the notes on the appropriate stave
      if (clef === "treble") {
        voice.draw(context, trebleStave);
      } else {
        voice.draw(context, bassStave);
      }

      // Add stave connectors
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

  // Calculate the average of the last 4 times
  const averageTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2) : 0;

  return (
    <div className="container">
      <div id="staff" className="grand-staff"></div>

      <div className="results-bar">
        <div className="result-item">
          <p>Correct Notes</p>
          <p className="big-number">{totalAttempts>0?correctNotes:'-'}/{totalAttempts}</p>
        </div>
        <div className="result-item">
          <p>Score</p>
          <p className="big-number">{totalAttempts>0 ? ((correctNotes / totalAttempts) * 100).toFixed(0) + '%': '-'}</p>
        </div>
        <div className="result-item">
          <p>Elapsed Time</p>
          <p className="big-number">{elapsedTime ? elapsedTime + 's' : "-"}</p>
        </div>
        <div className="result-item">
          <p>Average Time</p>
          <p className="big-number">{averageTime ? averageTime +'s' : "-"}</p>
        </div>
        <div className="result-item">
          <p>Best Time</p>
          <p className="big-number">{minTime ? minTime.toFixed(2)+'s' : "-"}</p>
        </div>
      </div>
    </div>
  );
};

export default MusicTrainer;
