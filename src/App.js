import React, { useEffect, useState, useCallback } from "react";
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

  // MIDI Input handler wrapped in useCallback to prevent unnecessary re-creations
  const handleMIDIInput = useCallback((midiAccess) => {
    const inputs = midiAccess.inputs.values();
    for (let input of inputs) {
      input.onmidimessage = handleMIDIMessage;
    }
  }, []);

  const handleMIDIMessage = (message) => {
    const [status, note, velocity] = message.data;
    console.log(status, note, velocity);
    if (status === noteOff && velocity > 0) {
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
  }, [midiNote, randomNote, startTime, minTime]);

  useEffect(() => {
    // Set up Web MIDI API
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(handleMIDIInput).catch(console.error);
    } else {
      console.error("Web MIDI API is not supported in this browser.");
    }
  }, [handleMIDIInput]);

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
    <div>
      <div id="staff"></div>

      {/* Display MIDI note, color red if incorrect */}
      <div className={`midi-note ${isNoteCorrect === false ? 'incorrect' : ''}`}>
        {(!isNoteCorrect) && midiNote && <p>Note Played: {midiNote}</p>}
        {showGeneratedNote && <p className="generated-note">Note: {randomNote}</p>}
      </div>

      {/* Display Elapsed Time */}
      <div className="time-board">
        <p>Elapsed Time: {elapsedTime.toFixed(2)} seconds</p>
        <p>Average Time (last 4): {averageTime} seconds</p>
        <p>Minimum Time: {minTime ? minTime.toFixed(2) : "-"} seconds</p>
      </div>

      {/* Display Score and Progress */}
      <div className="score-board">
        <p>Correct Notes: {correctNotes}</p>
        <p>Total Attempts: {totalAttempts}</p>
        <p>Score: {((correctNotes / totalAttempts) * 100).toFixed(2)}%</p>
      </div>
    </div>
  );
};

export default MusicTrainer;
