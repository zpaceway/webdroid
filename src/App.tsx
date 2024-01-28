import { useCallback, useEffect, useRef, useState } from "react";
import { Draggable } from "./components/Draggable";
import { NoteCard } from "./components/NoteCard";
import {
  FaPlusCircle,
  FaCloudDownloadAlt,
  FaFileExport,
  FaTrashAlt,
  FaSyncAlt,
  FaStickyNote,
} from "react-icons/fa";
import Sheet, { TNote } from "./utils/Sheet";
import Debouncer from "./utils/Debouncer";

const App = () => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<Sheet>(new Sheet());
  const [ready, setReady] = useState(false);
  const [notes, setNotes] = useState<Sheet["notes"]>([]);
  const [lastChange, setLastChange] = useState(sheetRef.current.lastChange);
  const debouncerRef = useRef(new Debouncer({ delay: 1000 }));

  const save = useCallback(() => {
    const dbOpenRequest = indexedDB.open("sticky", 1);
    dbOpenRequest.onupgradeneeded = () => {
      const db = dbOpenRequest.result;
      if (db.objectStoreNames.contains("sheets")) return;
      db.createObjectStore("sheets", { keyPath: "id" });
    };
    dbOpenRequest.onsuccess = () => {
      const db = dbOpenRequest.result;
      const transaction = db.transaction(["sheets"], "readwrite");
      const sheets = transaction.objectStore("sheets");
      sheets?.put({
        id: sheetRef.current.id,
        data: sheetRef.current.serialize(),
      });
    };
  }, []);

  useEffect(() => {
    sheetRef.current.onChange = () => {
      setLastChange(sheetRef.current.lastChange);
      debouncerRef.current.exec(() => {
        save();
      });
    };
  }, [save]);

  useEffect(() => {
    const dbOpenRequest = indexedDB.open("sticky", 1);
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
        const sheetIdFromLocalStorage = localStorage.getItem("sheetId");
        const newSheetId = sheetIdFromLocalStorage || crypto.randomUUID();
        if (!sheetIdFromLocalStorage) {
          const clearRequest = sheets.clear();
          clearRequest.onsuccess = () => {
            window.location.href = `${window.location.href}?id=${newSheetId}`;
          };

          return;
        }
        window.location.href = `${window.location.href}?id=${newSheetId}`;
        return;
      }

      const sheetRequest = sheets.get(currentSheetId);

      sheetRequest.onsuccess = () => {
        const result = sheetRequest.result;
        if (result) {
          const {
            id,
            notes: rawNotes,
            lastChange,
          } = JSON.parse(result.data) as {
            id: string;
            notes: TNote[];
            lastChange: string;
          };
          sheetRef.current.id = id;
          sheetRef.current.lastChange = new Date(lastChange);
          sheetRef.current.notes = [];

          rawNotes.map((rawNote) => sheetRef.current.addNote(rawNote));

          setNotes([...sheetRef.current.notes]);
          setReady(true);
          return localStorage.setItem("sheetId", currentSheetId);
        }
        const clearRequest = sheets.clear();
        clearRequest.onsuccess = () => {
          sheetRef.current.notes = [];
          setNotes([...sheetRef.current.notes]);
          sheetRef.current.id = currentSheetId;
          sheets.add({
            id: currentSheetId,
            data: sheetRef.current.serialize(),
          });
          setReady(true);

          localStorage.setItem("sheetId", currentSheetId);
        };
      };
    };
  }, []);

  if (!ready) {
    return <></>;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="relative h-full w-full overflow-hidden bg-slate-800">
        <div className="absolute inset-x-0 top-0 z-50 flex h-16 justify-between bg-blue-800 p-4 text-sm text-white shadow-md">
          <div className="relative flex items-center gap-4">
            <div className="text-base">
              <FaStickyNote />
            </div>
            <button
              className="fixed bottom-4 left-0 flex h-10 w-10 translate-x-[calc(50vw_-_20px)] items-center justify-center rounded-full bg-blue-500 shadow-md"
              onClick={() => {
                sheetRef.current?.addNote();
                setNotes([...sheetRef.current.notes]);
              }}
            >
              <FaPlusCircle />
            </button>
            <input
              ref={inputFileRef}
              type="file"
              className="hidden h-0 w-0"
              onChange={(e) => {
                const file = e.target.files?.[0];

                file?.text().then((savefile) => {
                  const rawNotes = JSON.parse(savefile).notes as TNote[];
                  sheetRef.current.notes = [];
                  rawNotes.map((rawNote) => sheetRef.current.addNote(rawNote));
                  setNotes([...sheetRef.current.notes]);
                });
              }}
            />
            <button
              className="rounded-md bg-blue-500 px-4 py-2 shadow-md"
              onClick={() => {
                inputFileRef.current?.click();
              }}
            >
              <FaCloudDownloadAlt />
            </button>
            <button
              className="rounded-md bg-blue-500 px-4 py-2 shadow-md"
              onClick={() => {
                const savefile = JSON.stringify({ notes });
                const blob = new Blob([savefile]);

                const url = window.URL.createObjectURL(blob);

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
              <FaFileExport />
            </button>
            <button
              className="rounded-md bg-blue-500 px-4 py-2 shadow-md"
              onClick={() => {
                localStorage.removeItem("sheetId");
                window.location.href = window.location.href.replace(
                  window.location.search,
                  "",
                );
              }}
            >
              <FaTrashAlt />
            </button>
          </div>
          <div
            onClick={() => {
              sheetRef.current.lastChange = new Date();
            }}
            className="fixed bottom-0 right-0 flex cursor-pointer select-none  items-center gap-1 bg-blue-800 bg-opacity-50 px-2 py-0.5 text-[10px]"
          >
            <div>
              <FaSyncAlt />
            </div>
            <div>{lastChange.toLocaleString()}</div>
          </div>
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
            <NoteCard
              key={note.signature}
              note={note}
              onSelected={() => {
                if (notes.slice(-1)[0].id === note.id) return;
                sheetRef.current.notes = [
                  ...sheetRef.current.notes!.filter(
                    (_note) => _note.id !== note.id,
                  ),
                  note,
                ];
                setNotes([...sheetRef.current.notes]);
              }}
              onRemove={() => {
                sheetRef.current.notes = sheetRef.current.notes.filter(
                  (_note) => _note.id !== note.id,
                );
                setNotes([...sheetRef.current.notes]);
              }}
            />
          ))}
        </Draggable>
      </div>
    </div>
  );
};

export default App;
