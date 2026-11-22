import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  return params.then(({ size }) => {
    if (size !== "192" && size !== "512") return new Response("Not found", { status: 404 });
    const pixels = Number(size);
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#4f46e5,#7c3aed 58%,#a21caf)" }}>
        <svg width="75%" height="75%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M70 198 256 116l186 82-186 82L70 198Z" stroke="white" strokeWidth="25" strokeLinejoin="round" />
          <path d="M147 242v82c0 65 218 65 218 0v-82" stroke="white" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M440 200v116" stroke="white" strokeWidth="25" strokeLinecap="round" />
          <circle cx="440" cy="330" r="18" fill="white" />
        </svg>
      </div>,
      { width: pixels, height: pixels }
    );
  });
}
