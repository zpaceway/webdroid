import { useEffect, useRef, useState } from "react";
import { Draggable } from "../Draggable";
import { ImCross } from "react-icons/im";
import { IoColorFill } from "react-icons/io5";
import { PiTextBFill } from "react-icons/pi";
import { Note } from "../../utils/Sheet";
import { TPosition } from "../Draggable/types";
import { MdHideImage, MdImage } from "react-icons/md";
import { TbNotes, TbNotesOff } from "react-icons/tb";

const NoteCard = ({
  note,
  onSelected,
  onRemove,
}: {
  note: Note;
  onSelected: () => void;
  onRemove: () => void;
}) => {
  const [backgroundColor, setBackgroundColor] = useState(note.backgroundColor);
  const [textColor, setTextColor] = useState(note.textColor);
  const [width, setWidth] = useState(note.dimensions.width);
  const [height, setHeight] = useState(note.dimensions.height);
  const [text, setText] = useState(note.text);
  const [image, setImage] = useState(note.image);
  const scrollableRef = useRef<HTMLDivElement>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  const backgroundColorPickerRef = useRef<HTMLInputElement>(null);
  const textColorPickerRef = useRef<HTMLInputElement>(null);
  const imagePickerRef = useRef<HTMLInputElement>(null);

  const observerRef = useRef(
    new ResizeObserver((entries) => {
      const entry = entries[0];
      const card = (entry.target as HTMLDivElement).getBoundingClientRect();
      const width = Math.round(card.width);
      const height = Math.round(card.height);

      if (
        width === note.dimensions.width &&
        height === note.dimensions.height
      ) {
        return;
      }
      note.dimensions = {
        width,
        height,
      };

      setWidth(width);
      setHeight(height);
    }),
  );

  useEffect(() => {
    const observer = observerRef.current;
    const card = cardRef.current;
    if (!card) return;
    observer.observe(card);

    return () => {
      observer.unobserve(card);
    };
  }, []);

  return (
    <Draggable
      ref={cardRef}
      onDragStart={onSelected}
      onTouchStart={onSelected}
      onClick={onSelected}
      key={note.id}
      initialPosition={note.position}
      onPositionChanged={(position: TPosition) => {
        note.position = position;
      }}
      className="absolute flex resize flex-col overflow-hidden rounded-md text-sm font-medium shadow"
      style={{
        background: backgroundColor,
        color: textColor,
        width,
        height,
      }}
    >
      <div className="flex h-8 shrink-0 grow-0 items-center justify-between bg-black bg-opacity-20 px-4">
        <div>
          <div className="cursor-pointer text-sm text-white" onClick={onRemove}>
            <ImCross />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex cursor-pointer items-center text-base text-white"
            onClick={() => {
              if (note.text === null) {
                note.text = "";
                return setText("");
              }
              note.text = null;
              setText(null);
            }}
          >
            {text === null ? <TbNotes /> : <TbNotesOff />}
          </div>
          <div
            className="flex cursor-pointer items-center text-base text-white"
            onClick={() => {
              if (image) {
                note.image = "";
                return setImage("");
              }
              imagePickerRef.current?.click();
            }}
          >
            <input
              ref={imagePickerRef}
              type="file"
              className="h-0 w-0 opacity-0"
              onChange={(e) => {
                const blob = e.target.files?.[0];

                new Promise<string>((res) => {
                  if (!blob) return;

                  const reader = new FileReader();
                  reader.onloadend = function () {
                    res(reader.result?.toString() || "");
                  };
                  reader.readAsDataURL(blob);
                }).then((image) => {
                  note.image = image;
                  setImage(image);
                });
              }}
            />
            {image ? <MdHideImage /> : <MdImage />}
          </div>
          <div className="flex cursor-pointer items-center text-base text-white">
            <input
              ref={textColorPickerRef}
              className="h-0 w-0 opacity-0"
              type="color"
              onChange={(e) => {
                note.textColor = e.target.value;
                setTextColor(e.target.value);
              }}
              value={textColor}
            />
            <PiTextBFill
              className="text-base"
              onClick={() => textColorPickerRef.current?.click()}
            />
          </div>
          <div className="flex cursor-pointer items-center text-base text-white">
            <input
              ref={backgroundColorPickerRef}
              className="h-0 w-0 opacity-0"
              type="color"
              onChange={(e) => {
                note.backgroundColor = e.target.value;
                setBackgroundColor(e.target.value);
              }}
              value={backgroundColor}
            />
            <IoColorFill
              className="text-base"
              onClick={() => backgroundColorPickerRef.current?.click()}
            />
          </div>
        </div>
      </div>
      <div className="overflow-hidden">
        <div
          ref={scrollableRef}
          className="h-full overflow-auto"
          onTouchStart={(e) => {
            const element = scrollableRef.current as HTMLDivElement;

            if (
              element.scrollWidth > element.clientWidth ||
              element.scrollHeight > element.clientHeight
            ) {
              e.stopPropagation();
            }
          }}
        >
          <div>
            {text !== null && (
              <div
                className="w-full whitespace-pre-wrap bg-transparent p-4 outline-none"
                contentEditable
                dangerouslySetInnerHTML={{ __html: text }}
                onBlur={(e) => {
                  note.text = e.target.innerHTML;
                  setText(e.target.innerHTML);
                }}
                onPaste={(e) => {
                  let blob: File | null = null;
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf("image") === 0) {
                      const item = items[i].getAsFile();
                      if (item) {
                        blob = item;
                      }
                    }
                  }

                  new Promise<string>((res) => {
                    if (!blob) return;

                    const reader = new FileReader();
                    reader.onloadend = function () {
                      res(reader.result?.toString() || "");
                    };
                    reader.readAsDataURL(blob);
                  }).then((image) => {
                    note.image = image;
                    setImage(image);
                  });
                }}
              />
            )}

            {image && (
              <div>
                <img
                  src={image}
                  className="h-full w-full object-fill"
                  draggable={false}
                  alt=""
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default NoteCard;
