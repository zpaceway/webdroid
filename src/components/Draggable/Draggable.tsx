import { forwardRef, useEffect, useRef, useState } from "react";
import { TPosition } from "./types";
import Debouncer from "../../utils/Debouncer";

type TDraggableProps = {
  ctrl?: boolean;
  initialPosition?: TPosition;
} & React.HTMLAttributes<HTMLDivElement>;

const Draggable = forwardRef<HTMLDivElement, TDraggableProps>(
  (
    {
      ctrl,
      children,
      className,
      onDragStart,
      onDragEnd,
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
    const [canDrag, setCanDrag] = useState(true);
    const debouncerRef = useRef(new Debouncer({ delay: 500 }));

    useEffect(() => {
      const handleScroll = () => {
        canDrag && setCanDrag(false);

        debouncerRef.current.exec(() => {
          setCanDrag(true);
        });
      };
      addEventListener("scroll", handleScroll, true);

      return () => {
        removeEventListener("scroll", handleScroll, true);
      };
    }, [canDrag]);

    return (
      <div
        {...rest}
        ref={ref}
        className={`${className} touch-none`}
        draggable={canDrag}
        style={{
          ...style,
          transform: `translate(${position.x}px, ${position.y}px`,
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragStart={(e) => {
          const img = new Image();
          img.src =
            "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
          e.dataTransfer?.setDragImage(img, 0, 0);

          if (ctrl && !e.ctrlKey) return;
          if (!ctrl && e.ctrlKey) return;
          setDragStartOptions({
            client: { x: e.clientX, y: e.clientY },
            position: { ...position },
          });
          onDragStart?.(e);
        }}
        onDrag={(e) => {
          if (!dragStartOptions) return;
          if (!e.clientX && !e.clientY && !e.pageX && !e.pageY) return;
          const deltaX = dragStartOptions.client.x - e.clientX;
          const deltaY = dragStartOptions.client.y - e.clientY;
          const newPosition = {
            x: dragStartOptions.position.x - deltaX,
            y: dragStartOptions.position.y - deltaY,
          };
          initialPosition.x = newPosition.x;
          initialPosition.y = newPosition.y;
          setPosition(newPosition);
        }}
        onDragEnd={(e) => {
          setDragStartOptions(undefined);
          onDragEnd?.(e);
        }}
        //////////////////////////////////////////////////////////////

        onTouchStart={(e) => {
          if (ctrl && !(e.touches.length === 2)) return;
          if (!ctrl && e.touches.length === 2) return;
          setDragStartOptions({
            client: {
              x: e.targetTouches[0].clientX,
              y: e.targetTouches[0].clientY,
            },
            position: { ...position },
          });
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
            x: dragStartOptions.position.x - deltaX,
            y: dragStartOptions.position.y - deltaY,
          };
          initialPosition.x = newPosition.x;
          initialPosition.y = newPosition.y;
          setPosition(newPosition);
        }}
        onTouchEnd={() => {
          setDragStartOptions(undefined);
        }}
      >
        {children}
      </div>
    );
  },
);

export default Draggable;
