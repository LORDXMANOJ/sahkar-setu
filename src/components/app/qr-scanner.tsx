"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";

type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };

/**
 * Camera QR reader. Uses the browser's BarcodeDetector where it exists
 * (Chrome on Android) and falls back to jsQR everywhere else.
 */
export function QRScanner({ onResult, paused }: { onResult: (text: string) => void; paused: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "starting" | "on" | "denied" | "unsupported">("idle");
  const onResultRef = useRef(onResult);
  const pausedRef = useRef(paused);
  useEffect(() => {
    onResultRef.current = onResult;
    pausedRef.current = paused;
  });

  const running = state === "on" || state === "starting";

  useEffect(() => {
    if (!running) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("unsupported");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
      } catch {
        setState("denied");
        return;
      }
      if (stopped || !video.current) return;
      video.current.srcObject = stream;
      await video.current.play().catch(() => {});
      setState("on");

      const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
      const detector = BD ? new BD({ formats: ["qr_code"] }) : null;
      const jsQR = detector ? null : (await import("jsqr")).default;

      const scan = async () => {
        if (stopped) return;
        const v = video.current;
        if (v && v.readyState >= 2 && !pausedRef.current) {
          try {
            if (detector) {
              const codes = await detector.detect(v);
              if (codes[0]?.rawValue) onResultRef.current(codes[0].rawValue);
            } else if (jsQR && ctx) {
              const w = 480;
              const h = Math.round((v.videoHeight / v.videoWidth) * w) || 360;
              canvas.width = w;
              canvas.height = h;
              ctx.drawImage(v, 0, 0, w, h);
              const img = ctx.getImageData(0, 0, w, h);
              const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
              if (code?.data) onResultRef.current(code.data);
            }
          } catch {
            // A dropped frame is fine; try the next one.
          }
        }
        timer = setTimeout(scan, 220);
      };
      scan();
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [running]);

  return (
    <div className="mx-auto max-w-sm">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#0e1330]">
        <video ref={video} playsInline muted className={`size-full object-cover transition-opacity ${state === "on" ? "opacity-100" : "opacity-0"}`} />
        {/* Viewfinder */}
        {running && (
          <div className="pointer-events-none absolute inset-[16%] rounded-xl shadow-[0_0_0_999px_rgb(14_19_48/0.45)]" aria-hidden="true">
            {["top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl"].map((c) => (
              <span key={c} className={`absolute size-9 border-warn ${c}`} />
            ))}
          </div>
        )}
        {!running && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-[#eceef8]">
            <div>
              {state === "denied" || state === "unsupported" ? (
                <>
                  <CameraOff className="mx-auto size-10 opacity-70" aria-hidden="true" />
                  <p className="mt-3 text-sm opacity-80">
                    {state === "denied"
                      ? "Camera access is blocked. Allow it in your browser settings, or open your phone's camera app and point it at the code."
                      : "This browser can't use the camera. Open your phone's camera app and point it at the code instead."}
                  </p>
                </>
              ) : (
                <>
                  <Camera className="mx-auto size-10 opacity-70" aria-hidden="true" />
                  <p className="mt-3 text-sm opacity-80">Point your camera at the code on the trainer&apos;s screen.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setState(running ? "idle" : "starting")}
        className={`btn mt-4 w-full ${running ? "btn-ghost" : "btn-primary"}`}
      >
        {running ? "Turn camera off" : state === "denied" ? "Try again" : "Scan the code"}
      </button>
    </div>
  );
}
