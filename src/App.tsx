import { useCallback, useEffect, useRef, useState } from "react";
import { Draggable } from "./components/Draggable";
import { TNote } from "./components/Note/types";
import { Note } from "./components/Note";
import Debouncer from "./utils/Debouncer";

const App = () => {
  const [notes, setNotes] = useState<TNote[]>([]);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [sheetId, setSheetId] = useState<string>();
  const [lastSaved, setLastSaved] = useState<Date>();
  const debouncerRef = useRef(new Debouncer({ delay: 1000 }));

  const save = useCallback(() => {
    if (!sheetId) return;

    const dbOpenRequest = indexedDB.open("sheet", 1);
    dbOpenRequest.onupgradeneeded = () => {
      const db = dbOpenRequest.result;
      if (db.objectStoreNames.contains("sheets")) return;
      db.createObjectStore("sheets", { keyPath: "id" });
    };
    dbOpenRequest.onsuccess = () => {
      const db = dbOpenRequest.result;
      const transaction = db.transaction(["sheets"], "readwrite");
      const sheets = transaction.objectStore("sheets");
      const sheetRequest = sheets.get(sheetId);

      const currentSheetData = {
        id: sheetId,
        notes,
        lastSaved: lastSaved?.toISOString(),
      };

      sheetRequest.onsuccess = () => {
        const sheet = sheetRequest.result;
        if ((sheet.data as string) === JSON.stringify(currentSheetData)) return;

        const newLastSaved = new Date();
        currentSheetData.lastSaved = newLastSaved.toISOString();
        setLastSaved(newLastSaved);
        sheets?.put({
          id: sheetId,
          data: JSON.stringify(currentSheetData),
        });
      };
    };
  }, [lastSaved, notes, sheetId]);

  useEffect(() => {
    const interval = setInterval(() => {
      debouncerRef.current.exec(() => {
        save();
      });
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [save]);

  useEffect(() => {
    const dbOpenRequest = indexedDB.open("sheet", 1);
    dbOpenRequest.onupgradeneeded = () => {
      const db = dbOpenRequest.result;
      if (db.objectStoreNames.contains("sheets")) return;
      db.createObjectStore("sheets", { keyPath: "id" });
    };
    dbOpenRequest.onsuccess = () => {
      const db = dbOpenRequest.result;
      const transaction = db.transaction(["sheets"], "readwrite");
      const sheets = transaction.objectStore("sheets");

      const currentSheetId = new URLSearchParams(location.search).get("id");
      if (!currentSheetId) {
        const newSheetId = crypto.randomUUID();
        const clearRequest = sheets.clear();
        clearRequest.onsuccess = () => {
          window.location.href = `${window.location.href}?id=${newSheetId}`;
        };
        return;
      }

      const sheetRequest = sheets.get(currentSheetId);

      sheetRequest.onsuccess = () => {
        const result = sheetRequest.result;
        if (result) {
          const { id, notes, lastSaved } = JSON.parse(result.data) as {
            id: string;
            notes: TNote[];
            lastSaved: string;
          };
          setSheetId(id);
          setNotes(notes);
          setLastSaved(new Date(lastSaved));
          return;
        }
        sheets.add({
          id: currentSheetId,
          data: JSON.stringify({
            id: currentSheetId,
            notes: [],
            lastSaved: new Date().toISOString(),
          }),
        }),
          currentSheetId;
        setSheetId(currentSheetId);
      };
    };
  }, []);

  if (sheetId === undefined) {
    return <></>;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="relative h-full w-full overflow-hidden bg-slate-800">
        <div className="absolute inset-x-0 top-0 z-50 flex justify-between bg-blue-800 p-4 text-sm text-white shadow-md">
          <div className="flex gap-4">
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
            <button
              className="rounded-md bg-blue-500 px-4 py-2 shadow-md"
              onClick={() => {
                save();
              }}
            >
              Save
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
              Export
            </button>
            <button
              className="rounded-md bg-blue-500 px-4 py-2 shadow-md"
              onClick={() => {
                window.location.href = window.location.href.replace(
                  window.location.search,
                  "",
                );
              }}
            >
              New
            </button>
          </div>
          <div>Last Saved: {lastSaved?.toLocaleString()}</div>
        </div>
        <Draggable
          ctrl
          className="relative h-[1000vh] w-[1000vw] bg-white"
          style={{
            backgroundImage:
              "repeating-linear-gradient(#ebebeb 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #ebebeb 0 1px, transparent 1px 100%)",
            backgroundSize: "32px 32px",
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
