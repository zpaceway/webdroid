import { TPosition } from "../components/Draggable/types";

export type TNote = {
  id: string;
  backgroundColor: string;
  textColor: string;
  position: TPosition;
  dimensions: { width: number; height: number };
  text: string;
  image: string;
};

export class Note implements TNote {
  readonly id: string;
  private _sheet: Sheet;
  private _backgroundColor: string;
  private _textColor: string;
  private _position: TPosition;
  private _dimensions: { width: number; height: number };
  private _text: string;
  private _image: string;

  public signature: string;

  constructor(sheet: Sheet, note?: TNote) {
    this._sheet = sheet;
    this.id = note?.id || crypto.randomUUID();
    this._backgroundColor = note?.backgroundColor || "#3b82f6";
    this._textColor = note?.textColor || "#ffffff";
    this._position = note?.position || {
      x: 100 + Math.random() * 50 - Math.random() * 50,
      y: 100 + Math.random() * 50 - Math.random() * 50,
    };
    this._dimensions = note?.dimensions || { width: 160, height: 160 };
    this._text = note?.text || "";
    this._image = note?.image || "";
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
    this._backgroundColor = backgroundColor;
    this._sheet.onChange?.("backgroundColor");
  }
  set textColor(textColor: Note["_textColor"]) {
    this._textColor = textColor;
    this._sheet.onChange?.("textColor");
  }
  set position(position: Note["_position"]) {
    this._position = position;
    this._sheet.onChange?.("position");
  }
  set dimensions(dimensions: Note["_dimensions"]) {
    this._dimensions = dimensions;
    this._sheet.onChange?.("dimensions");
  }
  set text(text: Note["_text"]) {
    this._text = text;
    this._sheet.onChange?.("text");
  }
  set image(image: Note["_image"]) {
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

  constructor() {
    this._id = crypto.randomUUID();
    this._notes = [];
    this._lastChange = new Date();
  }

  addNote(note?: TNote) {
    const newNote = new Note(this, note);
    this._notes.push(newNote);
    this.onChange?.("notes");

    return newNote;
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
  get onChange(): ((source: string) => void) | null {
    return this._onChange;
  }

  set id(id: Sheet["_id"]) {
    this._id = id;
  }
  set notes(notes: Sheet["_notes"]) {
    this._notes = notes;
    this._onChange?.("notes");
  }
  set lastChange(lastChange: Sheet["_lastChange"]) {
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

  serialize() {
    return JSON.stringify(this.toJSON());
  }
}

export default Sheet;
