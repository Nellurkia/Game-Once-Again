# 《再来一次》音乐、美术与剧情文案需求表

本表依据 Phase 1 PRD、当前游戏源码和用户提供的完整剧本整理。正式对白已接入；本表仍用于补齐分章节配乐、专属美术和音效等资源。

## 音乐资源

游戏已接入用户提供的背景音乐，章节配乐可在 `public/data/music.json` 中配置。下表为后续分章节制作的交付建议；新曲接入前沿用现有背景音乐。

| 优先级 | 使用位置／触发点 | 建议文件名 | 数量 | 交付要求 |
|---|---|---|---:|---|
| 建议必需 | 标题页、序章老年房间 | `public/assets/audio/bgm_room_twilight.mp3` | 1 | 黄昏、旧房间、回忆；可循环；无歌词。序章复用标题曲。 |
| 建议必需 | 第一幕·童年（一周目、二周目复用） | `public/assets/audio/bgm_ch1_childhood.mp3` | 1 | 童年探索感中带少许不安；可循环。 |
| 建议必需 | 第二幕·少年（一周目、二周目复用） | `public/assets/audio/bgm_ch2_adolescence.mp3` | 1 | 青春、错过的节拍；可循环。 |
| 建议必需 | 第三幕·青年剧情（两种周目） | `public/assets/audio/bgm_ch3_youth.mp3` | 1 | 房间里的迟疑、走出门与站台等待；节制、可循环，不制造战斗或追逐气氛。 |
| 建议必需 | 第四幕·成年（一周目、二周目复用） | `public/assets/audio/bgm_ch4_adulthood.mp3` | 1 | 碎片、关系与整理；可循环。 |
| 建议必需 | 一周目结算／NEW GAME+ 解锁 | `public/assets/audio/bgm_interlude.mp3` | 1 | 由遗憾转向重来的机会；适合作为短过场或可循环曲。 |
| 建议必需 | 结局 NE「留下」 | `public/assets/audio/bgm_ending_ne.mp3` | 1 | 接纳此刻人生的收束感。 |
| 建议必需 | 结局 TE「和解」 | `public/assets/audio/bgm_ending_te.mp3` | 1 | 与原本的自己和解；可与 NE 共用动机，编曲须有区分。 |
| 建议必需 | 片尾字幕 | `public/assets/audio/bgm_credits.mp3` | 1 | 收束全曲，可循环或提供干净结束点。 |
| 建议必需 | 按钮确认、结局选择 | `public/assets/audio/sfx_ui_confirm.mp3`、`public/assets/audio/sfx_ending_select.mp3` | 2 | 短促清晰，避免刺耳。 |
| 建议必需 | 对话推进、幕布转场 | `public/assets/audio/sfx_dialogue_next.mp3`、`public/assets/audio/sfx_transition.mp3` | 2 | 短音效；可分别用于点击反馈和红幕转场。 |
| 第一阶段玩法 | 童年迷宫：收集碎片、撞到影子、抵达目标房间 | `public/assets/audio/sfx_memory_collect.mp3`、`public/assets/audio/sfx_ghost_hit.mp3`、`public/assets/audio/sfx_room_arrive.mp3` | 3 | 反馈差异清楚；重复触发时不突兀。 |
| 第三幕剧情可选 | 脚步、开门、消息通知、站内广播、离站 | `public/assets/audio/sfx_ch3_step.mp3`、`public/assets/audio/sfx_ch3_door.mp3`、`public/assets/audio/sfx_ch3_message.mp3`、`public/assets/audio/amb_ch3_station.mp3`、`public/assets/audio/sfx_ch3_departure.mp3` | 5 | 小游戏已移除，此处仅供后续剧情演出使用；广播不写死城市、A 的身份或机会类型。 |
| 可选 | 老年房间环境底噪 | `public/assets/audio/amb_room_evening.mp3` | 1 | 轻微室内、窗外暮色氛围；不盖过对白，可关闭。 |

**建议交付规范：**配乐 MP3、44.1 kHz、立体声；单曲约 1–3 分钟，提供可无缝循环版本或标记循环点。音效 MP3/OGG、44.1 kHz，短音效建议单声道。另交 WAV 母带可供后期混音。音乐、人声和音效分轨；文件不带版权不明的采样或歌词。统一小写蛇形命名，禁止空格与 `final_final2` 一类版本名。若需改名，同步修改音频 manifest。

## 美术资源

现有 `public/data/manifest.json` 是**图片清单数组**，章节背景由 `src/scenes/ChapterScene.js` 按 `asset` 加载。图片可以通过改清单里的 `src` 替换，不需要改小游戏逻辑。当前插画和迷宫元素主要由代码内 SVG／Phaser 图形绘制；对应正式插画交付后，需将其接入 manifest 或场景。

| 优先级 | 资源／用途 | 建议文件名（仓库相对路径） | 规格与命名要求 | 接入说明 |
|---|---|---|---|---|
| 建议必需 | 标题页／序章黄昏房间主视觉 | `public/assets/title_room_twilight.png` | 1280×720，16:9；sRGB；需保留文字摆放安全区，文件无文字。 | 目前 SVG 场景写在 `src/ui/room.js`，manifest 中尚无此项；替换时需把插画移到资源文件，并将 `title_room` 加入清单、接入标题页与序章。 |
| 必需替换 | 第一幕·童年背景 | `public/assets/ch1_bg.png` | 1280×720；走廊／儿童房氛围，无界面字、按钮和游戏目标标记。 | 清单 ID `ch1_bg` 当前指向 `assets/ch1_bg.svg`；改为 PNG 时同步把 `src` 改为 `assets/ch1_bg.png`。 |
| 必需替换 | 第二幕·少年背景 | `public/assets/ch2_bg.png` | 1280×720；表现少年时期；为节奏玩法留出中间操作区。 | 将 `ch2_bg` 的 manifest `src` 改为 PNG 路径。 |
| 已接入，可精修 | 第三幕·青年房间、门口、站台与会合插画 | `public/assets/illustrations/Y1-rental-night.png`、`Y4-door-hesitation.png`、`Y6-empty-platform.png`、`Y10-ng-running-corridor.png`、`Y11-ng-platform-reunion.png`、`Y12-ng-side-by-side.png` | 16:9；两周目的同一空间构图呼应，界面文字另行渲染。 | 由 `Illustrations.js` 接入青年剧情；第三幕小游戏已移除。 |
| 必需替换 | 第四幕·成年背景 | `public/assets/ch4_bg.png` | 1280×720；表现关系、生活碎片与成年阶段；避免把必要提示烘焙进背景。 | 将 `ch4_bg` 的 manifest `src` 改为 PNG 路径。 |
| 第一阶段玩法 | 童年迷宫墙体／地块图集 | `public/assets/ch1_maze_tiles.png` | 透明背景；每个地块同尺寸、网格对齐，附地块尺寸和 atlas 坐标。 | 当前墙、豆子、目标房间均由 Phaser 绘制；正式图集须接入 `pacman` renderer。 |
| 第一阶段玩法 | 玩家与影子 sprite sheet | `public/assets/ch1_characters.png` | 透明背景；逐帧统一尺寸；附命名帧表／atlas JSON；方向与动画状态分组。 | 当前角色与影子是圆形代码占位；接入时将 sprite sheet 加到 ch1 资源清单。 |
| 后续玩法 | 第二幕节拍／判定 UI | `public/assets/ch2_rhythm_atlas.png` | 透明背景；节拍提示、命中反馈、判定图标分图层，附 atlas 坐标。 | Rhythm stub 升级为实际小游戏时接入。 |
| 后续玩法 | 第四幕拼图碎片图集 | `public/assets/ch4_puzzle_atlas.png` | 透明背景；拼图边缘和拼合状态可辨，提供原图预览及切片规则。 | Puzzle stub 升级为实际小游戏时接入。 |
| 建议 | NE 留下结局背景 | `public/assets/ending_ne_bg.png` | 1280×720；低细节、不烘焙文案，为结局文字留白。 | 结局演出实现时接入。 |
| 建议 | TE 和解结局背景 | `public/assets/ending_te_bg.png` | 1280×720；与 NE 色调／构图可辨地区分。 | 结局演出实现时接入。 |
| 建议 | 片尾背景 | `public/assets/credits_bg.png` | 1280×720；暗部文字对比充足；无署名文字烘焙在图内。 | 片尾字幕接入时使用；也可复用结局背景。 |

**交付文件约定：**PNG 使用 sRGB；纯背景 1280×720；透明 sprite 保留 Alpha，按 1× 原始逻辑像素制作，并提供 atlas／帧信息。SVG 仅用于矢量插画和 UI 图标。图像本身不放对白、章节标题或游戏内数字；在不同屏幕缩放时重要主体须位于中间安全区。统一提供资源 ID、预览图、文件名、尺寸和简短替换说明。字体如需随包提供，先核实可再分发许可。

## 剧情文案需求

`public/data/story.json` 已按用户提供的《再来一次——完整剧情剧本 v0.1.docx》导入可读对白。文档中的演出提示作为镜头、转场与画面节奏参考，不作为角色对白。姓名、日期、原伴侣老年状态等待定信息继续保持模糊，没有在程序里擅自定案。

| 文案段落 | 场景编号 | 接入方式 |
|---|---|---|
| 一周目序章与童年 | P1-01 至 P1-03 | P1-01 序章；P1-02 进入第一幕游戏；P1-03 游戏后接早晨。 |
| 一周目少年 | P1-04 至 P1-05 | P1-04、P1-05 前段在第二幕游戏前；最后一段在游戏后。 |
| 一周目青年 | P1-06 至 P1-07 | P1-06 接入青年探索；错过车站后进入 P1-07。 |
| 一周目成年、老年与穿越 | P1-08 至 P1-14 | P1-08 至 P1-12 前段在第四幕拼图前；拼图后续接 P1-12 后段、P1-13 与 P1-14，回到标题并把入口改为“再来一次”。 |
| 非一周目序章与童年 | P2-01 至 P2-03 | 标题选择“再来一次”后播 P2-01；第一幕游戏前后分别接 P2-02、P2-03。 |
| 非一周目少年 | P2-04 至 P2-05 | 游戏前后拆开 P2-05；表达少年时主动说出“有一点”。 |
| 非一周目青年与成年 | P2-06 至 P2-14 | 离家前接 P2-06；赶上站台后接 P2-07 与 P2-08 至 P2-13；进入第四幕前接 P2-14。迟到结果另有可重试提示。 |
| 非一周目完整拼图 | P2-15 至 P2-18 | 第四幕通关后按四个场景依次呈现，再进入三个最终选项。 |
| 三个最终结局 | E-B-01 至 E-B-03；E-A-01 至 E-A-03；E-T-01 至 E-T-03 | 分别演出 Bad Ending《再来一次》、Another Ending《留下》与 True Ending《还没结束》，随后显示各自结尾字幕。 |

本次从剧本正文拆入 **41 个场景、575 条对白与旁白**。脚本明确的动作由当前小游戏完成；脚本未定义的选择、不确定的角色身份与时间信息继续保留空白。演出效果使用现有插画、黑场、转场、亮度变化及结尾标题动画；最终 CG、配音与专门配乐仍待对应素材交付。

## 剧情 JSON 文件模板

模板文件：[story.template.json](story.template.json)。写稿后按键名检查，可复制为 `public/data/story.json`。它是当前可直接运行的对白副本。后续改写请先核对剧本场景编号和周目顺序，再同步 `public/data/story.json`。

最小条目示例：

```json
{
  "speaker": "角色名或叙述者",
  "text": "这一屏对白（不超过 100 个汉字，含标点）"
}
```

带选项的示例：

```json
{
  "speaker": "角色名",
  "text": "这一屏对白与选项引导。",
  "choices": [
    { "text": "选项一", "flag": "choice_key_one" },
    { "text": "选项二", "flag": "choice_key_two" }
  ]
}
```

## 替换与验收清单

- [ ] 每份交付都带上述建议文件名；文件改名后同步 `manifest.json`／音频清单。
- [ ] 四个章节背景比例均为 16:9，无标题字、UI、目标标记或水印。
- [ ] sprite sheet 随附帧尺寸、帧名、排序和 atlas JSON。
- [ ] 正式音乐有可循环版本和授权说明；音效长度、响度适合重复触发。
- [ ] `story.json` 保留完整剧本场景键：`prologue`、P1/P2 各幕对白、`E-B-01` 至 `E-B-03`、`E-A-01` 至 `E-A-03`、`E-T-01` 至 `E-T-03`。
- [ ] 每个对白 item 有 `speaker`、`text`；每屏不超过 100 汉字；完整剧本场景和对白均已覆盖。
- [ ] 剧情分支如依赖 flag，另附旗标清单、触发位置、结局判定表；不能假设现有代码已支持条件分支。
