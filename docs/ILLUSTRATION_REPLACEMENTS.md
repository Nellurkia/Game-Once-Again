# 插图替换记录

来源：用户提供的 `插图.zip`（76 张）及一周目第二幕补充插图（6 张）。按当前剧情与玩法接入 35 张原始文件，位于 `public/assets/illustrations/`。第三幕现已整体替换为青年时期《出门之前》，追加对应出租屋、门口、车站和青年人物素材。

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

部分文件用于多个位置。主界面继续使用已拼合且菜单对齐的房间插画；新增按钮与图标从原图通过 SVG 视口裁切，渲染滤镜去除白色背景。人物表通过 SVG 视口显示完整站立姿势，原文件未裁改。对话背景由 `src/systems/Illustrations.js` 按对白行、当前场景和回应分支选择，恢复存档时同步恢复相应画面。

《出门之前》的结果画面分别使用站台空位与会合插图，青年尾声继续使用对应素材。图片通过画布绘制为记忆背景；可操作地图与交互点由程序绘制。人物表按各自实际尺寸通过 SVG 视口裁切，源文件保留原样。

其他家庭晚餐等未对应到当前剧情的素材暂不纳入页面。整张掌机小游戏插画也没有替换现有可操作地图。《拾光》的像素拼图地图继续使用原项目画面。所有剩余原文件仍在解压素材目录，可待对应内容加入后再接入。

验证包括青年剧情人物裁切、入场与结果换图、周目判定、剧情树分支权限和手机比例缩放；完整小游戏验证见 `BEFORE_DEPARTURE.md`。
