"use client"

import { useEffect, useRef } from "react"
import { reportError } from "@/lib/telemetry/report-error"

// WebGL2 fullscreen-triangle shaders — a soft three-blob "aurora" in the
// brand palette (mint / steel blue / light blue) drifting over the dark hero
// photo. Deliberately tiny: no three.js / R3F dependency, no geometry, two
// shaders and a single draw call. If ANYTHING fails (no WebGL2, shader
// compile/link error, context loss) the component has already rendered
// nothing — the hero's static photo+scrim gradient remains the backdrop, so
// a broken effect can never read as a broken site.

const VERT = `#version 300 es
void main() {
  vec2 pos[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

void main() {
  vec2 frag = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = frag * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;
  p -= u_mouse * 0.12;

  float t = u_time * 0.12;
  vec3 mint  = vec3(0.345, 0.749, 0.647);
  vec3 steel = vec3(0.435, 0.631, 0.780);
  vec3 light = vec3(0.757, 0.871, 0.871);

  vec2 c1 = vec2(sin(t) * 0.55, cos(t * 0.8) * 0.35);
  vec2 c2 = vec2(cos(t * 0.7) * 0.45, sin(t * 1.1 + 0.5) * 0.4);
  vec2 c3 = vec2(sin(t * 1.3 + 2.0) * 0.6, cos(t * 0.9 + 1.5) * 0.5);

  float b1 = smoothstep(0.55, 0.0, length(p - c1));
  float b2 = smoothstep(0.50, 0.0, length(p - c2));
  float b3 = smoothstep(0.45, 0.0, length(p - c3));

  vec3 col = mint * b1 * 0.55 + steel * b2 * 0.45 + light * b3 * 0.35;
  float a = max(max(b1 * 0.50, b2 * 0.42), b3 * 0.40);

  fragColor = vec4(col, a);
}`

export function HeroWebGLBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let gl: WebGL2RenderingContext | null = null
    try {
      gl = canvas.getContext("webgl2", {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
      })
    } catch (error) {
      // F-65: a dropped connection here is invisible server-side, so the
      // failure is reported as well as shown (rate-limited, never throws).
      reportError(error, { scope: "client", action: "webglBackdrop" })
      return
    }
    if (!gl) return
    const ctx = gl

    const compile = (type: number, source: string) => {
      const sh = ctx.createShader(type)
      if (!sh) return null
      ctx.shaderSource(sh, source)
      ctx.compileShader(sh)
      if (!ctx.getShaderParameter(sh, ctx.COMPILE_STATUS)) {
        ctx.deleteShader(sh)
        return null
      }
      return sh
    }

    const vs = compile(ctx.VERTEX_SHADER, VERT)
    const fs = compile(ctx.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const program = ctx.createProgram()
    if (!program) return
    ctx.attachShader(program, vs)
    ctx.attachShader(program, fs)
    ctx.linkProgram(program)
    if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) return
    ctx.useProgram(program)

    const uRes = ctx.getUniformLocation(program, "u_resolution")
    const uTime = ctx.getUniformLocation(program, "u_time")
    const uMouse = ctx.getUniformLocation(program, "u_mouse")

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const finePointer = window.matchMedia("(pointer: fine)").matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const w = Math.max(1, Math.round(rect.width * dpr))
      const h = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        ctx.viewport(0, 0, w, h)
      }
      ctx.uniform2f(uRes, w, h)
    }
    resize()

    const render = (time: number, mx: number, my: number) => {
      ctx.uniform1f(uTime, time)
      ctx.uniform2f(uMouse, mx, my)
      ctx.drawArrays(ctx.TRIANGLES, 0, 3)
    }

    let raf = 0
    let mx = 0
    let my = 0
    let targetX = 0
    let targetY = 0

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      targetY = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    }
    const onLeave = () => {
      targetX = 0
      targetY = 0
    }

    if (reduced) {
      // One static frame — the glow stays but nothing animates.
      render(0, 0, 0)
    } else {
      const start = performance.now()
      const loop = (now: number) => {
        if (!document.hidden) {
          mx += (targetX - mx) * 0.05
          my += (targetY - my) * 0.05
          render((now - start) / 1000, mx, my)
        }
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    if (finePointer) {
      window.addEventListener("pointermove", onPointer)
      window.addEventListener("pointerleave", onLeave)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onPointer)
      window.removeEventListener("pointerleave", onLeave)
      ro.disconnect()
      ctx.deleteProgram(program)
      ctx.deleteShader(vs)
      ctx.deleteShader(fs)
      ctx.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    />
  )
}
