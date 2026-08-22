"use client";

import { useId } from "react";
import styled from "styled-components";

type LoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: 38,
  md: 78,
  lg: 132
};

export function Loader({ label, size = "md" }: LoaderProps) {
  const filterId = useId().replace(/:/g, "");
  const gradientId = `${filterId}-gradient`;
  const dimension = sizes[size];

  return (
    <StyledWrapper $dimension={dimension} role="status" aria-label={label ?? "Carregando"}>
      <div className="loader-orbit">
        <svg className="loader-filter" aria-hidden="true">
          <defs>
            <filter id={filterId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation={7} result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -10"
                result="merged"
              />
              <feComposite in="SourceGraphic" in2="merged" operator="atop" />
            </filter>
            <linearGradient id={gradientId} x1="40" y1="40" x2="160" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#35bfe7" />
              <stop offset="0.62" stopColor="#9de8fb" />
              <stop offset="1" stopColor="#f2c94c" />
            </linearGradient>
          </defs>
        </svg>

        <svg
          className="loader-spinner"
          width={dimension}
          height={dimension}
          viewBox="0 0 200 200"
          aria-hidden="true"
          style={{ filter: `url(#${filterId})` }}
        >
          <path
            className="loader-half"
            stroke={`url(#${gradientId})`}
            d="m164 100c0-35.346-28.654-64-64-64s-64 28.654-64 64 28.654 64 64 64 64-26.215 64-64-26.92-64-64-64-65.267 26.923-64 64c1.267 37.077 26.703 65.053 64 64 37.297-1.053 64-64 64-64"
          />
          <circle className="loader-track" stroke={`url(#${gradientId})`} cx="100" cy="100" r="64" />
        </svg>

        <svg
          className="loader-shadow"
          width={dimension}
          height={dimension}
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <path
            className="loader-half"
            stroke="#35bfe7"
            d="m164 100c0-35.346-28.654-64-64-64s-64 28.654-64 64 28.654 64 64 64 64-26.215 64-64-26.92-64-64-64-65.267 26.923-64 64c1.267 37.077 26.703 65.053 64 64 37.297-1.053 64-64 64-64"
          />
          <circle className="loader-track" stroke="#f2c94c" cx="100" cy="100" r="64" />
        </svg>
      </div>
      {label && <span>{label}</span>}
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $dimension: number }>`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #9fb1c1;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  .loader-orbit {
    position: relative;
    width: ${({ $dimension }) => $dimension}px;
    height: ${({ $dimension }) => $dimension}px;
  }

  .loader-filter {
    position: absolute;
    width: 0;
    height: 0;
  }

  .loader-spinner,
  .loader-shadow {
    position: absolute;
    inset: 0;
  }

  .loader-half,
  .loader-track {
    fill: none;
    stroke-width: 23;
    stroke-linecap: round;
  }

  .loader-half {
    stroke-dasharray: 180 800;
    animation: loader-spin 10s linear infinite;
  }

  .loader-track {
    stroke-dasharray: 26 54;
    animation: loader-spin 3s linear infinite;
  }

  .loader-shadow {
    filter: blur(5px);
    opacity: 0.34;
    transform: translate(2px, 2px);
  }

  @keyframes loader-spin {
    to {
      stroke-dashoffset: -403px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .loader-half,
    .loader-track {
      animation-duration: 1ms;
      animation-iteration-count: 1;
    }
  }
`;

export default Loader;
