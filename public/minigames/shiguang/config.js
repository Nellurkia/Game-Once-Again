/* 所有尺寸为 1280 × 720 设计坐标／世界像素。建议默认值，可按文档调整。 */
window.MEMORY_CONFIG = Object.freeze({
  version: '0.2.0', schemaVersion: 2, contentVersion: 'layered-map-2',
  designWidth: 1280, designHeight: 720,
  viewport: { x: 0, y: 56, width: 1024, height: 608 },
  physics: { moveSpeed: 240, gravity: 1600, jumpVelocity: -620, maxFallSpeed: 900,
    coyoteTime: .1, jumpBuffer: .12, fixedStep: 1 / 60, maxSteps: 5 },
  player: { width: 28, height: 52 },
  interactionRadius: 56, snapRadius: 32, dragOpacity: .85,
  returnDelay: .25, idleHintSeconds: 20,
  pauseDuringDrag: true, allowRotate: false, allowRemove: false,
  carryKey: { enabled: false },
  bindings: { left: ['KeyA','ArrowLeft'], right: ['KeyD','ArrowRight'],
    jump: ['Space'], interact: ['KeyE'], return: ['KeyR'], help: ['KeyH'], map: ['KeyM'], pause: ['Escape','KeyP'] },
  palette: { sky: '#172b2b', shadow: '#14251e', ground: '#594f32', amber: '#e4bd72', paper: '#e7d4aa' }
});
