# 插图替换记录

来源：用户提供的 `插图.zip`，共 76 张。按当前剧情与玩法接入 22 张原始文件，位于 `public/assets/illustrations/`。不按压缩包的章节编号机械对应：其中童年争吵的内容用于现有第三幕《不要出声》。

| 使用位置 | 原文件 |
| --- | --- |
| 主菜单四个按钮及图标 | M5-button-kit.png、M6-icon-kit.png |
| 序章发现掌机、按键、通用回忆备用画面 | shot1-console-found.jpg、shot3-press-button.png、shot2-screen-glow.png |
| 第一幕入场、门边画面 | C1-bedroom-night.png、C3-hand-on-door.png |
| 第二幕掌机入场、一周目章节画面、二周目掌机画面 | T6-stairwell-console.png、T7-chapter-card.png、T13-minigame-week2.png |
| 第三幕入场和掌机、入睡、躲回去、沉默、表达害怕 | C1-bedroom-night.png、C5-blanket-console.png、C7-morning-asleep.png、NG1-mother-enters.png、NG2-say-afraid.png |
| 第四幕回忆入场和尾声 | A5-empty-child-room.png |
| 幕间、结局选择、NE、TE、制作人员 | E2-new-game-plus.png、E1-save-menu.png、E3-save-current-life.png、E4-restore-save.png、E5-phone-final.png |
| 第一/第三幕童年立绘、第二幕少年立绘 | child-char-sheet.png、teen-char-sheet.png |

部分文件用于多个位置。主界面继续使用已拼合且菜单对齐的房间插画；新增按钮与图标从原图通过 SVG 视口裁切，渲染滤镜去除白色背景。人物表通过 SVG 视口显示完整站立姿势，原文件未裁改。对话背景由 `src/systems/Illustrations.js` 按对白行、当前场景和回应分支选择，恢复存档时同步恢复相应画面。

《不要出声》的结尾使用对应插图，保留原有玩法与周目判定。图片通过画布绘制为背景，不改变可互动物体的位置或碰撞。

其余青年租房、赶车、家庭晚餐等素材对应的剧情目前没有实现，暂不纳入页面。整张掌机小游戏插画也没有替换现有可操作地图。《拾光》的像素拼图地图继续使用原项目画面。所有剩余原文件仍在解压素材目录，可待对应内容加入后再接入。

验证：构建通过，现有 22 项测试通过；浏览器确认对白换图、人物裁切、周目/回应/结局图片、菜单点击及手机比例缩放，没有缺失资源或页面错误。另回归《不要出声》的房间、掌机、回应与续读流程。
