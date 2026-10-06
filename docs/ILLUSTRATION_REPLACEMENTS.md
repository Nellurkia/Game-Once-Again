# 插图替换记录

来源：用户提供的 `插图.zip`（76 张）、一周目第二幕补充插图（6 张）及《替换图片.docx》（39 张）。新增文档插图以 `story-replace-01.webp` 至 `story-replace-39.webp` 放在 `public/assets/illustrations/`，由原图转为 WebP 后共约 3 MB。按对白行号在一、二周目分别接入；映射逻辑位于 `src/systems/Illustrations.js`。第三幕使用用户提供的《最后一班车》跑酷；出租屋、门口、车站和青年人物素材继续用于前后剧本对白。

| 使用位置 | 原文件 |
| --- | --- |
| 主菜单四个按钮及图标 | M5-button-kit.png、M6-icon-kit.png |
| 序章发现掌机、按键、通用回忆备用画面 | shot1-console-found.jpg、shot3-press-button.png、shot2-screen-glow.png |
| 第一幕入场、门边画面 | C1-bedroom-night.png、C3-hand-on-door.png |
| 第二幕一周目少年剧情：教室画册、遭到嘲笑、散落画页、A伸手帮助、走廊约定与掌机 | T14-teen-console-stairs.png、T15-teen-sketchbook-classroom.png、T16-teen-classroom-bullying.png、T17-teen-scattered-drawings.png、T18-teen-friend-helps.png、T19-teen-hallway-goodbye.png |
| 第二幕二周目掌机与通用章节画面 | T6-stairwell-console.png、T7-chapter-card.png、T13-minigame-week2.png |
| 第三幕青年入场、门口、街道、错过与会合结果 | Y1-rental-night.png、Y4-door-hesitation.png、Y10-ng-running-corridor.png、Y6-empty-platform.png、Y11-ng-platform-reunion.png、Y12-ng-side-by-side.png |
| 第四幕回忆入场和尾声 | A5-empty-child-room.png |
| 幕间、结局选择、NE、TE、制作人员 | E2-new-game-plus.png、E1-save-menu.png、E3-save-current-life.png、E4-restore-save.png、E5-phone-final.png |
| 第一幕童年、第二幕少年、第三幕青年立绘 | child-char-sheet.png、teen-char-sheet.png、youth-char-sheet.png |

《替换图片.docx》的新增映射：序章 `prologue` 1–3、4–7；一周目第一幕入场 `ch1_w1` 4–6、7–9、10–11，游戏后 `p1_03` 1–5、6–8、9–10；第二幕 `p1_04`、`p1_05_pre`、`p1_05_post`；第三幕游戏后 `p1_07`；第四幕入场 `p1_08` 至 `p1_11` 及游戏后 `p1_12_pre`、`p1_14`。二周目映射 `ch1_w2`、`p2_03`、`p2_04`、`p2_05_post`，青年段 `p2_08` 至 `p2_12`，老年段 `p2_15`、`p2_17`、`p2_18`。文档中同一图跨章节复用时继续共用 WebP 文件。

部分文件用于多个位置。主界面继续使用已拼合且菜单对齐的房间插画；新增按钮与图标从原图通过 SVG 视口裁切，渲染滤镜去除白色背景。人物表通过 SVG 视口显示完整站立姿势，原文件未裁改。对话背景由 `src/systems/Illustrations.js` 按对白行、当前场景和回应分支选择，恢复存档时同步恢复相应画面。

第三幕青年剧情分别使用站台空位与会合插图呼应两周目的剧本走向。人物表按各自实际尺寸通过 SVG 视口裁切，源文件保留原样。结局选择页独立使用用户最新提供的 `E0-ending-choice.png`，正式结局剧情继续保留原有插图。

其他家庭晚餐等未对应到当前剧情的素材暂不纳入页面。整张掌机小游戏插画也没有替换现有可操作地图。《拾光》的像素拼图地图继续使用原项目画面。所有剩余原文件仍在解压素材目录，可待对应内容加入后再接入。

验证包括青年剧情人物裁切、对白换图、两周目旧存档迁移、剧情树节点权限和手机比例缩放。
