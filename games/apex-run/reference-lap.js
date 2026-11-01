// Fixed low-frequency keyboard-like input used only for physics/lifecycle
// regression. It is not represented as player usability evidence.
export const REFERENCE_INPUTS=Object.freeze({forward:Object.freeze({forward:true}),left:Object.freeze({forward:true,left:true}),brake:Object.freeze({reverse:true})});
export const REFERENCE_SEGMENTS=Object.freeze([
  [7.7,REFERENCE_INPUTS.forward],[1.12,REFERENCE_INPUTS.left],[3.3,REFERENCE_INPUTS.forward],
  [.9,REFERENCE_INPUTS.brake],[1.35,REFERENCE_INPUTS.left],[8.2,REFERENCE_INPUTS.forward],
  [1.3,REFERENCE_INPUTS.left],[7.7,REFERENCE_INPUTS.forward],[1.65,REFERENCE_INPUTS.left],
  [5.9,REFERENCE_INPUTS.forward],[1.4,REFERENCE_INPUTS.left],[6,REFERENCE_INPUTS.forward],
]);
export const referenceInputTape=Object.freeze(REFERENCE_SEGMENTS.flatMap(([seconds,input])=>Array.from({length:Math.round(seconds*120)},()=>input)));
