"use client";

import React, { useEffect, useRef, useState } from "react";

export const WAVE_CONFIG = {
  renderer: "webgl2",
  theme: "custom",
  colors: ["#07070f", "#4361ee", "#48bfe3", "#00ff17"],
  colorOpacities: [1, 1, 1, 1],
  waveCount: 3,
  speed: 0.04,
  amplitude: 0.2,
  frequency: 0.9,
  opacity: 0.15,
  thickness: 1,
  blur: 105,
  concentration: 0,
  randomness: 0,
  thicknessRandom: 0,
  verticalOffset: -0.1,
  rotation: 180,
  lmLiquid: 0.193,
  bloomThreshold: 0.85,
  bloomIntensity: 1.7,
  lumenIntensity: 1,
  twistAmount: 1,
  splitFill: true,
  glass: false,
  liquidMetal: true,
  bloom: false,
  lumen: false,
  twist: false,
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

export function WaveBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;

    const start2DFallback = () => {
      try {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let t = 0;
        const render2D = () => {
          t += WAVE_CONFIG.speed * 0.05;
          const w = (canvas.width = canvas.offsetWidth || 800);
          const h = (canvas.height = canvas.offsetHeight || 600);

          ctx.clearRect(0, 0, w, h);
          for (let i = 0; i < WAVE_CONFIG.waveCount; i++) {
            ctx.beginPath();
            ctx.moveTo(0, h * 0.5);
            for (let x = 0; x < w; x += 10) {
              const y =
                h * (0.5 + WAVE_CONFIG.verticalOffset) +
                Math.sin(x * 0.005 * WAVE_CONFIG.frequency + t + i) * h * WAVE_CONFIG.amplitude;
              ctx.lineTo(x, y);
            }
            ctx.strokeStyle = WAVE_CONFIG.colors[i % WAVE_CONFIG.colors.length];
            ctx.globalAlpha = WAVE_CONFIG.opacity;
            ctx.lineWidth = 40;
            ctx.stroke();
          }
          animationFrameId = requestAnimationFrame(render2D);
        };
        render2D();
      } catch {
        // ignore
      }
    };

    try {
      const gl =
        canvas.getContext("webgl2", { alpha: true, antialias: true }) ||
        (canvas.getContext("webgl") as WebGLRenderingContext | null);

      if (!gl) {
        start2DFallback();
        return () => cancelAnimationFrame(animationFrameId);
      }

      const vsSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
          v_uv = (a_position + 1.0) * 0.5;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision highp float;
        varying vec2 v_uv;

        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_color0;
        uniform vec3 u_color1;
        uniform vec3 u_color2;
        uniform vec3 u_color3;
        uniform float u_speed;
        uniform float u_amplitude;
        uniform float u_frequency;
        uniform float u_opacity;
        uniform float u_lmLiquid;
        uniform float u_verticalOffset;

        float wave(vec2 uv, float freq, float speed, float phase) {
          return sin(uv.x * freq + u_time * speed + phase) *
                 cos(uv.y * freq * 0.5 + u_time * speed * 0.8 + phase);
        }

        void main() {
          vec2 uv = v_uv;
          uv = 1.0 - uv;
          uv.y += u_verticalOffset;

          float t = u_time * u_speed;

          vec2 p = uv * u_frequency;
          float w1 = wave(p, 3.5, 1.2, 0.0);
          float w2 = wave(p + vec2(w1 * u_lmLiquid, w1 * 0.15), 4.2, 1.4, 2.1);
          float w3 = wave(p + vec2(w2 * u_lmLiquid, w2 * 0.2), 2.8, 0.9, 4.3);

          float combined = (w1 + w2 + w3) * u_amplitude + uv.y;

          vec3 col = u_color0;
          col = mix(col, u_color1, smoothstep(0.2, 0.6, combined));
          col = mix(col, u_color2, smoothstep(0.45, 0.75, combined + w2 * 0.2));
          col = mix(col, u_color3, smoothstep(0.65, 0.95, combined + w3 * 0.3));

          float alpha = u_opacity * smoothstep(0.0, 0.5, combined) * (1.0 - smoothstep(0.85, 1.0, combined));

          gl_FragColor = vec4(col, alpha);
        }
      `;

      function compileShader(targetGl: WebGLRenderingContext, type: number, src: string) {
        const shader = targetGl.createShader(type);
        if (!shader) return null;
        targetGl.shaderSource(shader, src);
        targetGl.compileShader(shader);
        return shader;
      }

      const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
      const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

      if (!vertexShader || !fragmentShader) {
        start2DFallback();
        return () => cancelAnimationFrame(animationFrameId);
      }

      const program = gl.createProgram();
      if (!program) {
        start2DFallback();
        return () => cancelAnimationFrame(animationFrameId);
      }

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );

      const posLoc = gl.getAttribLocation(program, "a_position");
      const timeLoc = gl.getUniformLocation(program, "u_time");
      const resLoc = gl.getUniformLocation(program, "u_resolution");
      const c0Loc = gl.getUniformLocation(program, "u_color0");
      const c1Loc = gl.getUniformLocation(program, "u_color1");
      const c2Loc = gl.getUniformLocation(program, "u_color2");
      const c3Loc = gl.getUniformLocation(program, "u_color3");
      const speedLoc = gl.getUniformLocation(program, "u_speed");
      const ampLoc = gl.getUniformLocation(program, "u_amplitude");
      const freqLoc = gl.getUniformLocation(program, "u_frequency");
      const opLoc = gl.getUniformLocation(program, "u_opacity");
      const lmLoc = gl.getUniformLocation(program, "u_lmLiquid");
      const voLoc = gl.getUniformLocation(program, "u_verticalOffset");

      const rgb0 = hexToRgb(WAVE_CONFIG.colors[0]);
      const rgb1 = hexToRgb(WAVE_CONFIG.colors[1]);
      const rgb2 = hexToRgb(WAVE_CONFIG.colors[2]);
      const rgb3 = hexToRgb(WAVE_CONFIG.colors[3]);

      const resize = () => {
        if (typeof window === "undefined") return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const displayWidth = canvas.clientWidth || 800;
        const displayHeight = canvas.clientHeight || 600;

        if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
      };

      window.addEventListener("resize", resize);
      resize();

      let startTime = performance.now();

      const render = () => {
        resize();
        const elapsed = (performance.now() - startTime) / 1000;

        gl.useProgram(program);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(timeLoc, elapsed);
        gl.uniform2f(resLoc, canvas.width, canvas.height);
        gl.uniform3fv(c0Loc, rgb0);
        gl.uniform3fv(c1Loc, rgb1);
        gl.uniform3fv(c2Loc, rgb2);
        gl.uniform3fv(c3Loc, rgb3);
        gl.uniform1f(speedLoc, WAVE_CONFIG.speed);
        gl.uniform1f(ampLoc, WAVE_CONFIG.amplitude);
        gl.uniform1f(freqLoc, WAVE_CONFIG.frequency);
        gl.uniform1f(opLoc, WAVE_CONFIG.opacity);
        gl.uniform1f(lmLoc, WAVE_CONFIG.lmLiquid);
        gl.uniform1f(voLoc, WAVE_CONFIG.verticalOffset);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        animationFrameId = requestAnimationFrame(render);
      };

      render();

      return () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(animationFrameId);
      };
    } catch {
      start2DFallback();
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [isMounted]);

  if (!isMounted) {
    return <div className={`w-full h-full pointer-events-none ${className}`} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full pointer-events-none ${className}`}
      style={{
        filter: `blur(${WAVE_CONFIG.blur}px)`,
        transform: `rotate(${WAVE_CONFIG.rotation}deg)`,
      }}
    />
  );
}