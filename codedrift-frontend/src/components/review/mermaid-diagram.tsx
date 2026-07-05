/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import { useEffect, useState, type JSX } from "react";
import mermaid from "mermaid";
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { TransformComponent, TransformWrapper, useControls } from "react-zoom-pan-pinch";
import Loader from "@/components/loader.tsx";
import { Button } from "@/components/ui/button.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";

interface MermaidDiagramProps {
  code: string;
}

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  suppressErrorRendering: true,
});

let diagramCounter = 0;

interface ZoomControlsProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const ZoomControls = ({ isFullscreen, onToggleFullscreen }: ZoomControlsProps): JSX.Element => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute right-2 top-2 z-10 flex gap-1">
      <Button variant="outline" size="sm" aria-label="Zoom in" onClick={() => zoomIn(0.25)}>
        <ZoomIn size={14} />
      </Button>
      <Button variant="outline" size="sm" aria-label="Zoom out" onClick={() => zoomOut(0.25)}>
        <ZoomOut size={14} />
      </Button>
      <Button variant="outline" size="sm" aria-label="Reset zoom" onClick={() => resetTransform()}>
        <RotateCcw size={14} />
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        onClick={onToggleFullscreen}>
        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </Button>
    </div>
  );
};

const MermaidDiagram = ({ code }: MermaidDiagramProps): JSX.Element => {
  const [svg, setSvg] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return (): void => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasError(false);

    diagramCounter += 1;
    mermaid
      .render(`codedrift-mermaid-${diagramCounter}`, code)
      .then(({ svg: renderedSvg }) => {
        if (!cancelled) {
          setSvg(renderedSvg);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
        }
      });

    return (): void => {
      cancelled = true;
    };
  }, [code]);

  if (hasError) {
    return (
      <pre
        className={
          "overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs " +
          THIN_SCROLLBAR_CLASS
        }>
        {code}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-border">
        <Loader />
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 overflow-hidden bg-white"
          : "relative overflow-hidden rounded-md border border-border bg-white py-10"
      }>
      <TransformWrapper
        minScale={0.4}
        maxScale={4}
        centerOnInit
        doubleClick={{ disabled: true }}
        wheel={{ step: 0.001 }}>
        <ZoomControls
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((current) => !current)}
        />
        <TransformComponent
          wrapperStyle={{ width: "100%", height: isFullscreen ? "100vh" : "360px" }}
          contentStyle={{ width: "100%", height: "100%" }}>
          <div
            className="flex h-full w-full items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default MermaidDiagram;
