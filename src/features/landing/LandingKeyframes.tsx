import { createGlobalStyle } from 'styled-components'

/**
 * All landing page @keyframes defined globally.
 * Components reference these by plain string name (e.g. "lp-float1")
 * to avoid styled-components keyframe injection errors.
 */
export const LandingKeyframes = createGlobalStyle`
  @keyframes lp-slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes lp-float1 {
    0%,100% { transform: translate(0px,   0px)   scale(1);    }
    33%      { transform: translate(40px, -30px)  scale(1.08); }
    66%      { transform: translate(-25px, 20px)  scale(0.94); }
  }
  @keyframes lp-float2 {
    0%,100% { transform: translate(0px,   0px)   scale(1);    }
    33%      { transform: translate(-50px, 25px)  scale(1.06); }
    66%      { transform: translate(30px, -40px)  scale(0.96); }
  }
  @keyframes lp-float3 {
    0%,100% { transform: translate(0px,  0px)  scale(1);    }
    50%      { transform: translate(20px, 30px) scale(1.04); }
  }
  @keyframes lp-slideIn {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0);     }
  }
  @keyframes lp-pulse {
    0%,100% { opacity: 0.6; }
    50%      { opacity: 1;   }
  }
  @keyframes lp-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes lp-blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0; }
  }
  @keyframes lp-drawLine {
    from { stroke-dashoffset: 60; }
    to   { stroke-dashoffset: 0;  }
  }
  @keyframes lp-edgeGlow {
    0%,100% { stroke-opacity: 0.4; }
    50%      { stroke-opacity: 1;   }
  }
  @keyframes lp-rotate {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
  @keyframes lp-orbit {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
`
