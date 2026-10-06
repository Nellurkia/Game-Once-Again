# 第四章：老年回忆拼图

> 历史实现：第四幕现已替换为用户提供的《拾光 v0.2》，请见 [SHIGUANG.md](SHIGUANG.md)。以下记录旧版原型，不代表当前第四幕。

依据《老年回忆拼图小游戏_AI开发需求文档_v0.1》实现。正式回忆美术、地图和剧情尚待提供，目前采用三个可替换的示例段：旧窗、归路、暖灯；不把示例设定视为正式剧情。

## 游玩

- A/D 或左右方向键移动，Space 跳跃，E 拾取碎片、钥匙或开启出口。
- 从右栏拖动已拾取的切片，放入场景中同编号轮廓。道路从左向右拼接，正确拼合立即恢复碰撞。
- 放错、取消拖动、掉落都不丢失碎片。拖动时冻结角色和镜头，Esc 取消；R 返回安全点，H 帮助，P 暂停。
- 一周目有 9 块可用道路碎片，保留部分画面留白；二周目有 12 块，须全部放回。两种模式都需要出口钥匙。仅收集未放置不算完成。
- 周目由总游戏传入；本关不自行解锁周目。跨周目继承钥匙尚未启用。

## 文件与配置

`src/minigames/memory-puzzle/config.js` 定义地图尺寸、平台、拾取点、切片目标、恢复碰撞、安全点、依赖顺序、两种周目及物理参数。`validateLevel` 检查标识、引用、边界、拾取点支撑和依赖环。

`model.js` 负责确定性物理、交互、拼合判定、存档校验；`index.js` 负责 Canvas 绘制、拖放、键盘/触摸控制和帮助界面。画布为 1280×720，顶部 56、底部 56，右栏 256；镜头仅影响场景坐标。

## 存档与接入

宿主通过 `mountMemoryPuzzle(parent, {context:{playthrough}, save, onProgress, onComplete})` 接入。`onProgress(snapshot)` 必须在实际持久化成功时返回 `true`，否则界面显示未保存，并在后续操作时重试。返回实例提供 `getSaveData()`、`move(direction)`、`destroy()`。

总存档 `zlyc_save_v1` 中，`minigameSaves['memoryPuzzle:1']` 与 `['memoryPuzzle:2']` 分开保存。快照包含 `schemaVersion`、`contentVersion`、`levelId`、`variantId`、`checkpointId`、`pieceStates`、`keyStates`、`storyFlags`、`tutorialFlags`、`completed`；不保存拖动中间状态或角色速度。

拾取、拼合、取得钥匙、抵达安全点、暂停、离开与通关均保存。读档从安全点恢复并重建已拼道路。无效快照进入恢复界面，自动保存不会覆盖原记录；确认重置本关当前周目后可重新开始。清除总存档会清除本关记录。

通关回调只在玩家选择继续时触发，返回 `success`、`score`、`levelId`、`variantId` 及 `memoryPuzzleComplete` / `memoryPuzzleFull` 标记，再由宿主进入第四章结尾对白。

## 构建与离线验收

`npm run build` 同时生成正常网站和 `dist/memory-puzzle-offline.html`。后者可直接双击，无网络、外部字体或素材依赖，独立保存一周目进度；不提供自行切换周目的入口。网站版仍按宿主配置播放背景音乐。

`npm test` 覆盖两种周目的完整自然移动路线、拼合、通关条件、掉落/读档、失败存储、无效快照恢复与周目隔离。地图时长与正式内容需在后续内容制作后调优。
