import { useCallback, useEffect, useRef, useState } from "react";
import { Draggable } from "./components/Draggable";
import { NoteCard } from "./components/NoteCard";
import { FaPlusCircle, FaUpload, FaDownload, FaTrashAlt } from "react-icons/fa";
import Sheet from "./utils/Sheet";
import Debouncer from "./utils/Debouncer";
import { IoArrowUndo } from "react-icons/io5";

const App = () => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<Sheet>(new Sheet());
  const [ready, setReady] = useState(false);
  const [notes, setNotes] = useState<Sheet["notes"]>([]);
  const [historyCount, setHistoryCount] = useState(
    sheetRef.current.historyCount,
  );
  const [lastChange, setLastChange] = useState(sheetRef.current.lastChange);
  const debouncerRef = useRef(new Debouncer({ delay: 250 }));

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
        data: sheetRef.current.createSaveFile(),
      });
      setLastChange(sheetRef.current.lastChange);
      setHistoryCount(sheetRef.current.historyCount);
    };
  }, []);

  useEffect(() => {
    sheetRef.current.onChange = (source: string) => {
      console.log({ source });
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
          sheetRef.current.loadFromSavefile(result.data);
          setNotes([...sheetRef.current.notes]);
          setLastChange(sheetRef.current.lastChange);
          setHistoryCount(sheetRef.current.historyCount);
          setReady(true);
          return localStorage.setItem("sheetId", currentSheetId);
        }
        const clearRequest = sheets.clear();
        clearRequest.onsuccess = () => {
          sheetRef.current.notes = [];
          sheetRef.current.id = currentSheetId;
          sheets.add({
            id: currentSheetId,
            data: sheetRef.current.createSaveFile(),
          });
          setNotes([...sheetRef.current.notes]);
          setLastChange(sheetRef.current.lastChange);
          setHistoryCount(sheetRef.current.historyCount);
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
        <div className="absolute inset-x-0 bottom-0 z-50 flex h-16 justify-between bg-blue-600 bg-opacity-60 px-4 text-sm text-white shadow-md">
          <div className="relative flex items-center gap-4">
            <div
              className="relative cursor-pointer"
              onClick={() => {
                sheetRef.current?.addNote();
                setNotes([...sheetRef.current.notes]);
              }}
            >
              <FaPlusCircle />
            </div>
            {historyCount > 0 && (
              <div
                className="relative cursor-pointer"
                onClick={() => {
                  sheetRef.current.loadFromPreviousSaveFile();
                  setNotes([...sheetRef.current.notes]);
                  setLastChange(sheetRef.current.lastChange);
                  setHistoryCount(sheetRef.current.historyCount);
                }}
              >
                <IoArrowUndo />
              </div>
            )}

            <input
              ref={inputFileRef}
              type="file"
              className="hidden h-0 w-0"
              onChange={(e) => {
                const file = e.target.files?.[0];

                file?.text().then((saveFile) => {
                  sheetRef.current.loadFromSavefile(saveFile);
                  setNotes([...sheetRef.current.notes]);
                  setLastChange(sheetRef.current.lastChange);
                  setHistoryCount(sheetRef.current.historyCount);
                });
              }}
            />
            <button
              onClick={() => {
                inputFileRef.current?.click();
              }}
            >
              <FaUpload />
            </button>
            <button
              onClick={() => {
                const saveFile = JSON.stringify({ notes });
                const blob = new Blob([saveFile]);

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
              <FaDownload />
            </button>
            <button
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
            className="flex cursor-pointer select-none flex-col justify-center bg-opacity-60 px-2 py-1 text-right text-xs leading-4"
          >
            <div>{lastChange.toLocaleTimeString()}</div>
            <div>{lastChange.toLocaleDateString()}</div>
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
