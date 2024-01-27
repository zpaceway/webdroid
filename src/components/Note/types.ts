import { TPosition } from "../Draggable/types";

export type TNote = {
  id: string;
  backgroundColor: string;
  textColor: string;
  contents: { text: string; images: string[] }[];
  position: TPosition;
  dimensions: { width: number; height: number };
};
