import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { TPosition } from "./types";

type TDraggableProps = {
  ctrl?: boolean;
  initialPosition?: TPosition;
  onPositionChanged?: (position: TPosition) => void;
} & React.HTMLAttributes<HTMLDivElement>;

const Draggable = forwardRef<HTMLDivElement, TDraggableProps>(
  (
    {
      ctrl,
      children,
      className,
      onPositionChanged,
      onDragStart,
      onDragEnd,
      onTouchStart,
      onTouchEnd,
      style,
      initialPosition = { x: 0, y: 0 },
      ...rest
    }: TDraggableProps,
    ref,
  ) => {
    const [position, setPosition] = useState<{ x: number; y: number }>(
      initialPosition,
    );
    const [dragStartOptions, setDragStartOptions] = useState<{
      client: { x: number; y: number };
      position: { x: number; y: number };
    }>();
    const internalRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => internalRef.current!, []);

    return (
      <div
        {...rest}
        ref={internalRef}
        className={`${className} touch-none`}
        draggable
        style={{
          ...style,
          transform: `translate(${position.x}px, ${position.y}px`,
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragStart={(e) => {
          if (ctrl && !e.ctrlKey) return;
          if (!ctrl && e.ctrlKey) return;

          const img = new Image();
          img.src =
            "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
          e.dataTransfer?.setDragImage(img, 0, 0);
          setDragStartOptions({
            client: { x: e.clientX, y: e.clientY },
            position: { ...position },
          });
          onDragStart?.(e);
        }}
        onDrag={(e) => {
          if (!dragStartOptions) return;
          if (!e.clientX && !e.clientY && !e.pageX && !e.pageY) return;

          internalRef.current!.style.opacity = "0.5";
          const deltaX = dragStartOptions.client.x - e.clientX;
          const deltaY = dragStartOptions.client.y - e.clientY;
          const newPosition = {
            x: Math.round(dragStartOptions.position.x - deltaX),
            y: Math.round(dragStartOptions.position.y - deltaY),
          };
          setPosition(newPosition);
          onPositionChanged?.(newPosition);
        }}
        onDragEnd={(e) => {
          internalRef.current!.style.opacity = "1";
          setDragStartOptions(undefined);
          onDragEnd?.(e);
        }}
        //////////////////////////////////////////////////////////////

        onTouchStart={(e) => {
          if (ctrl && !(e.touches.length === 2)) return;
          if (!ctrl && e.touches.length === 2) return;
          internalRef.current!.style.opacity = "0.5";
          setDragStartOptions({
            client: {
              x: e.targetTouches[0].clientX,
              y: e.targetTouches[0].clientY,
            },
            position: { ...position },
          });
          onTouchStart?.(e);
        }}
        onTouchMove={(e) => {
          if (ctrl && !(e.touches.length === 2)) return;
          if (!ctrl && e.touches.length === 2) return;
          if (!dragStartOptions) return;
          if (
            !e.targetTouches[0].clientX &&
            !e.targetTouches[0].clientY &&
            !e.targetTouches[0].pageX &&
            !e.targetTouches[0].pageY
          )
            return;
          const deltaX = dragStartOptions.client.x - e.targetTouches[0].clientX;
          const deltaY = dragStartOptions.client.y - e.targetTouches[0].clientY;
          const newPosition = {
            x: Math.round(dragStartOptions.position.x - deltaX),
            y: Math.round(dragStartOptions.position.y - deltaY),
          };
          setPosition(newPosition);
          onPositionChanged?.(newPosition);
        }}
        onTouchEnd={(e) => {
          internalRef.current!.style.opacity = "1";
          setDragStartOptions(undefined);
          onTouchEnd?.(e);
        }}
      >
        {children}
      </div>
    );
  },
);

export default Draggable;
