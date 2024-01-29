import { TPosition } from "../components/Draggable/types";
import Debouncer from "./Debouncer";

export type TNote = {
  id: string;
  backgroundColor: string;
  textColor: string;
  position: TPosition;
  dimensions: { width: number; height: number };
  text: string | null;
  image: string;
};

export class Note implements TNote {
  readonly id: string;
  private _sheet: Sheet;
  private _backgroundColor: string;
  private _textColor: string;
  private _position: TPosition;
  private _dimensions: { width: number; height: number };
  private _text: string | null;
  private _image: string;

  public signature: string;

  constructor(sheet: Sheet, note?: TNote) {
    this._sheet = sheet;
    this.id = note ? note.id : crypto.randomUUID();
    this._backgroundColor = note ? note.backgroundColor : "#3b82f6";
    this._textColor = note ? note.textColor : "#ffffff";
    this._position = note
      ? note.position
      : {
          x: 100 + Math.random() * 50 - Math.random() * 50,
          y: 100 + Math.random() * 50 - Math.random() * 50,
        };
    this._dimensions = note ? note.dimensions : { width: 160, height: 160 };
    this._text = note ? note.text : "";
    this._image = note ? note.image : "";
    this.signature = crypto.randomUUID(); // sign of authenticity
  }

  get sheet() {
    return this._sheet;
  }
  get backgroundColor() {
    return this._backgroundColor;
  }
  get textColor() {
    return this._textColor;
  }
  get position() {
    return this._position;
  }
  get dimensions() {
    return this._dimensions;
  }
  get text() {
    return this._text;
  }
  get image() {
    return this._image;
  }

  set backgroundColor(backgroundColor: Note["_backgroundColor"]) {
    this._sheet.saveHistory();
    this._backgroundColor = backgroundColor;
    this._sheet.onChange?.("backgroundColor");
  }
  set textColor(textColor: Note["_textColor"]) {
    this._sheet.saveHistory();
    this._textColor = textColor;
    this._sheet.onChange?.("textColor");
  }
  set position(position: Note["_position"]) {
    this._sheet.saveHistory();
    this._position = position;
    this._sheet.onChange?.("position");
  }
  set dimensions(dimensions: Note["_dimensions"]) {
    this._sheet.saveHistory();
    this._dimensions = dimensions;
    this._sheet.onChange?.("dimensions");
  }
  set text(text: Note["_text"]) {
    this._sheet.saveHistory();
    this._text = text;
    this._sheet.onChange?.("text");
  }
  set image(image: Note["_image"]) {
    this._sheet.saveHistory();
    this._image = image;
    this._sheet.onChange?.("image");
  }

  toJSON() {
    return {
      id: this.id,
      backgroundColor: this.backgroundColor,
      textColor: this.textColor,
      position: this.position,
      dimensions: this.dimensions,
      text: this.text,
      image: this.image,
    };
  }
}

class Sheet {
  private _id: string;
  private _notes: Note[];
  private _onChange: ((source: string) => void) | null = null;
  private _lastChange: Date;
  private _history: string[];
  private debouncer = new Debouncer({ delay: 500 });

  constructor() {
    this._id = crypto.randomUUID();
    this._notes = [];
    this._history = [];
    this._lastChange = new Date();
  }

  get historyCount() {
    return this._history.length;
  }

  get id() {
    return this._id;
  }
  get notes() {
    return this._notes;
  }
  get lastChange() {
    return this._lastChange;
  }
  get onChange() {
    return this._onChange;
  }

  set id(id: Sheet["_id"]) {
    this._id = id;
  }
  set notes(notes: Sheet["_notes"]) {
    this.saveHistory();
    this._notes = notes;
    this._onChange?.("notes");
  }
  set lastChange(lastChange: Sheet["_lastChange"]) {
    this.saveHistory();
    this._lastChange = lastChange;
    this._onChange?.("lastChange");
  }
  set onChange(onChange: Sheet["_onChange"]) {
    this._onChange = (source: string) => {
      this._lastChange = new Date();
      onChange?.(source);
    };
  }

  toJSON() {
    return {
      id: this.id,
      notes: this.notes.map((note) => note.toJSON()),
      lastChange: this._lastChange.toISOString(),
    };
  }

  saveHistory() {
    this.debouncer.exec(() => {
      const saveFile = this.createSaveFile();
      this._history.push(saveFile);
    });
  }

  createSaveFile() {
    return JSON.stringify(this.toJSON());
  }

  loadFromSavefile(saveFile: string) {
    const {
      id,
      notes: rawNotes,
      lastChange,
    } = JSON.parse(saveFile) as {
      id: string;
      notes: TNote[];
      lastChange: string;
    };
    this._id = id;
    this._notes = [];
    this._lastChange = new Date(lastChange);
    rawNotes.map((rawNote) => this.addNote(rawNote, false));
  }

  loadFromPreviousSaveFile() {
    const saveFile = this._history.pop();
    if (!saveFile) return;

    this.loadFromSavefile(saveFile);
  }

  addNote(note?: TNote, notify = true) {
    this.saveHistory();
    const newNote = new Note(this, note);
    this._notes.push(newNote);
    if (notify) this.onChange?.("notes");

    return newNote;
  }
}

export default Sheet;
