import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Formats commonly found on retail products.
 * Limiting the list makes scanning faster and more accurate.
 */
const hints = new Map();

hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
]);

hints.set(DecodeHintType.TRY_HARDER, true);

function getCameraErrorMessage(error) {
  switch (error?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera permission was denied. Allow camera access in your browser settings and try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device.";
    case "NotReadableError":
      return "The camera is being used by another app. Close it and try again.";
    default:
      return "Unable to start the camera. Please try again.";
  }
}

/**
 * Mounted only while the dialog is open, so the camera
 * starts when it opens and always stops when it closes.
 */
function ScannerView({ onDetected }) {
  const videoRef = useRef(null);
  const onDetectedRef = useRef(onDetected);

  const [status, setStatus] = useState("starting"); // starting | scanning | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let cancelled = false;
    let handled = false;
    let stream = null;
    let timer = null;

    const video = videoRef.current;

    // getUserMedia only exists on HTTPS (or localhost)
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("Camera access needs a secure (HTTPS) connection.");
      return;
    }

    const reader = new BrowserMultiFormatReader(hints);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    // Grab a frame from the video and try to read a barcode from it
    function scanFrame() {
      if (cancelled || handled) return;

      if (video.readyState >= 2 && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const result = reader.decodeFromCanvas(canvas);

          handled = true;
          navigator.vibrate?.(100);
          onDetectedRef.current(result.getText());
          return;
        } catch {
          // No barcode in this frame, try again below
        }
      }

      timer = setTimeout(scanFrame, 150);
    }

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        // Dialog was closed while waiting for camera permission
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        video.srcObject = stream;
        await video.play();

        if (cancelled) return;

        setStatus("scanning");
        scanFrame();
      } catch (error) {
        if (cancelled) return;

        console.error("Barcode scanner error:", error);
        setStatus("error");
        setErrorMessage(getCameraErrorMessage(error));
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());

      if (video) video.srcObject = null;
    };
  }, []);

  return (
    <div className="grid gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          className="size-full object-cover"
        />

        {status === "scanning" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-1/2 w-4/5 rounded-lg border-2 border-[#D4A017]/80">
              <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-red-500" />
            </div>
          </div>
        )}

        {status === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white">
            <Loader2 className="size-4 animate-spin" />
            Starting camera...
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">
            {errorMessage}
          </div>
        )}
      </div>

      {status === "scanning" && (
        <p className="text-center text-xs text-muted-foreground">
          Hold the barcode inside the frame. It will be detected automatically.
        </p>
      )}
    </div>
  );
}

export function BarcodeScannerDialog({ open, onOpenChange, onDetected }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan barcode</DialogTitle>

          <DialogDescription>
            Point your camera at the product barcode.
          </DialogDescription>
        </DialogHeader>

        <ScannerView onDetected={onDetected} />
      </DialogContent>
    </Dialog>
  );
}