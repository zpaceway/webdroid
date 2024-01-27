import { useRef, useState } from "react";
import { Draggable } from "./components/Draggable";
import { TNote } from "./components/Note/types";
import { Note } from "./components/Note";

const App = () => {
  const [notes, setNotes] = useState<TNote[]>([]);
  const inputFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="relative h-full w-full overflow-hidden bg-slate-800">
        <div className="absolute inset-x-0 top-0 z-50 flex gap-4 bg-blue-800 p-4 text-sm text-white shadow-md">
          <button
            className="rounded-md bg-blue-500 px-4 py-2 shadow-md"
            onClick={() => {
              setNotes((notes) => [
                ...notes,
                {
                  id: crypto.randomUUID(),
                  backgroundColor: "#3b82f6",
                  textColor: "#ffffff",
                  position: {
                    x: 100 + Math.random() * 50 - Math.random() * 50,
                    y: 100 + Math.random() * 50 - Math.random() * 50,
                  },
                  dimensions: { width: 100, height: 100 },
                  contents: [
                    {
                      text: "",
                      images: [],
                    },
                  ],
                },
              ]);
            }}
          >
            Add note
          </button>
          <input
            ref={inputFileRef}
            type="file"
            className="hidden h-0 w-0"
            onChange={(e) => {
              const file = e.target.files?.[0];

              file?.text().then((savefile) => {
                const notes = JSON.parse(savefile).notes as TNote[];
                setNotes(notes);
              });
            }}
          />
          <button
            className="rounded-md bg-blue-500 px-4 py-2 shadow-md"
            onClick={() => {
              inputFileRef.current?.click();
            }}
          >
            Load
          </button>
          <button
            className="rounded-md bg-blue-500 px-4 py-2 shadow-md"
            onClick={() => {
              const savefile = JSON.stringify({ notes });
              const blob = new Blob([savefile]);

              const url = window.URL.createObjectURL(blob);

              // Step 3: Create an anchor (<a>) element
              const a = document.createElement("a");
              document.body.appendChild(a);
              a.style.display = "none";
              a.href = url;
              a.download = "notes.json";

              a.click();

              window.URL.revokeObjectURL(url);
              a.remove();
            }}
          >
            Save
          </button>
        </div>
        <Draggable
          ctrl
          className="relative h-[1000vh] w-[1000vw] bg-white"
          style={{
            backgroundImage:
              "repeating-linear-gradient(#ebebeb 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #ebebeb 0 1px, transparent 1px 100%)",
            backgroundSize: "40px 40px",
          }}
        >
          {notes.map((note) => (
            <Note
              key={note.id}
              note={note}
              onSelected={() => {
                if (notes.slice(-1)[0].id === note.id) return;
                setNotes((notes) => [
                  ...notes.filter((_note) => _note.id !== note.id),
                  note,
                ]);
              }}
              onRemove={() => {
                setNotes((notes) =>
                  notes.filter((_note) => _note.id !== note.id),
                );
              }}
            />
          ))}
        </Draggable>
      </div>
    </div>
  );
};

export default App;
