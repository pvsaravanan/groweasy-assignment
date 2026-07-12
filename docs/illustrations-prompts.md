# CSV 导入器正文配图 — 生图提示词

基于 `CLAUDE.md` 里的架构说明生成，风格遵循 `.claude/skills/ian-xiaohei-illustrations`（小黑怪诞正文配图）。
每张图单独生成，不要拼图。生成后按 `01-`、`02-`... 顺序保存到 `assets/csv-importer-illustrations/`。

---

## 1. 任意形状 CSV → 固定 Schema（无硬编码匹配）

Structure: 概念隐喻

```text
Generate one standalone 16:9 horizontal Chinese article illustration.

Visual DNA:
Pure white background. Minimalist black hand-drawn line art. Slightly wobbly pen lines. Lots of empty white space. Sparse red/orange/blue handwritten Chinese annotations. Clean absurd product-sketch feeling. No gradients, no shadows, no paper texture, no complex background, no commercial vector style, no PPT infographic look, no cute mascot poster, no children's illustration, no realistic UI.

Recurring IP character required:
小黑, a small solid-black absurd creature with white dot eyes, tiny thin legs, blank serious expression, slightly uneven hand-drawn body shape. 小黑 must perform the core conceptual action, not decorate the scene. Make 小黑 serious, deadpan, and slightly bizarre, not cute.

Theme:
不管 CSV 长什么怪样子，都要被塞进同一个固定形状里，而且不是靠对照表硬套

Structure type:
概念隐喻

Core idea:
无论输入的表格形状多奇怪（不规则的纸片），小黑都用手把它一张张揉、折、压，最终塞进同一个固定木框里 —— 不是拿尺子比对，而是理解着改形状

Composition:
画面左侧散落几张形状各异、边缘破碎的纸片（代表不同来源的 CSV：不规则三角形、波浪边、带缺角的方形）。中间小黑正弯腰把其中一张纸片用双手揉捏、对折，塞进画面右侧一个固定形状的木框洞口里。木框洞口形状统一、干净。不要画尺子或对照表格。

Suggested elements:
不规则纸片堆 / 一个固定形状的木框洞口 / 小黑弯腰揉纸的动作 / 已经塞进洞口的几张纸角

Chinese handwritten labels:
什么形状都行 / 不用对照表 / 硬塞进去

Color use:
Black for main line art and 小黑. Orange for main flow/path/arrows. Red only for key warnings/problems/results. Blue only for secondary notes or feedback/system state.

Constraints:
One image explains only one core structure. Keep the main subject around 40%-60% of the canvas. Preserve at least 35% blank white space. Use at most 5-8 short handwritten Chinese labels. Do not write a title in the top-left corner. Do not write the structure type on the image. Do not make it a formal diagram, course slide, or dense explainer. Do not copy prior examples or reuse known case compositions unless explicitly requested; invent a fresh visual metaphor for this specific article. It should be clear but not instructional, interesting but not childish, strange but clean.
```

---

## 2. 预览阶段不调用 AI，只有确认才触发

Structure: Workflow（两段式）

```text
Generate one standalone 16:9 horizontal Chinese article illustration.

Visual DNA:
Pure white background. Minimalist black hand-drawn line art. Slightly wobbly pen lines. Lots of empty white space. Sparse red/orange/blue handwritten Chinese annotations. Clean absurd product-sketch feeling. No gradients, no shadows, no paper texture, no complex background, no commercial vector style, no PPT infographic look, no cute mascot poster, no children's illustration, no realistic UI.

Recurring IP character required:
小黑, a small solid-black absurd creature with white dot eyes, tiny thin legs, blank serious expression, slightly uneven hand-drawn body shape. 小黑 must perform the core conceptual action, not decorate the scene. Make 小黑 serious, deadpan, and slightly bizarre, not cute.

Theme:
看一眼不算数，只有真正推门那一下才会惊动里面那台会思考的怪机器

Structure type:
Workflow

Core idea:
预览阶段小黑只是趴在一扇小窗户上看数据表格，窗户后面的怪机器安静不动；只有小黑伸手推开旁边真正的门，机器才会亮灯运转起来

Composition:
画面左侧小黑踮脚趴在一个圆形小窗口往里看，窗内隐约是桌子上摆着的表格纸张，机器轮廓虚线、没有亮灯，处于关闭状态。画面右侧是一扇厚重的门，门后同一台机器（用实线画出，带一个小灯泡亮着）。小黑的另一只手正搭在门把手上，还没推开，画出犹豫的瞬间感。

Suggested elements:
圆形小窗口 / 虚线状态的沉睡机器 / 一扇门和门把手 / 亮灯的机器轮廓

Chinese handwritten labels:
先看一眼 / 机器还没醒 / 推门才算数

Color use:
Black for main line art and 小黑. Orange for main flow/path/arrows. Red only for key warnings/problems/results. Blue only for secondary notes or feedback/system state.

Constraints:
One image explains only one core structure. Keep the main subject around 40%-60% of the canvas. Preserve at least 35% blank white space. Use at most 5-8 short handwritten Chinese labels. Do not write a title in the top-left corner. Do not write the structure type on the image. Do not make it a formal diagram, course slide, or dense explainer. Do not copy prior examples or reuse known case compositions unless explicitly requested; invent a fresh visual metaphor for this specific article. It should be clear but not instructional, interesting but not childish, strange but clean.
```

---

## 3. 分批 + 并发 + 重试 + 降级模型

Structure: 系统局部

```text
Generate one standalone 16:9 horizontal Chinese article illustration.

Visual DNA:
Pure white background. Minimalist black hand-drawn line art. Slightly wobbly pen lines. Lots of empty white space. Sparse red/orange/blue handwritten Chinese annotations. Clean absurd product-sketch feeling. No gradients, no shadows, no paper texture, no complex background, no commercial vector style, no PPT infographic look, no cute mascot poster, no children's illustration, no realistic UI.

Recurring IP character required:
小黑, a small solid-black absurd creature with white dot eyes, tiny thin legs, blank serious expression, slightly uneven hand-drawn body shape. 小黑 must perform the core conceptual action, not decorate the scene. Make 小黑 serious, deadpan, and slightly bizarre, not cute.

Theme:
长纸条被剪成一捆一捆，同时塞进几个窄门，卡住的那捆不硬闯，而是被踢去旁边的小门

Structure type:
系统局部

Core idea:
小黑把一条很长的纸条剪成几small捆，同时塞进三个并排的窄闸门；其中一扇闸门卡住冒烟，小黑立刻把那捆纸条捞出来，改塞进旁边一个更小、更破旧的侧门

Composition:
画面左侧小黑手持剪刀，正把一条长纸条剪成三小捆。中间画三个并排的窄闸门，纸捆同时穿过，其中中间一个闸门卡住、上方冒出一点烟雾。小黑另一只手正把冒烟闸门里的纸捆拽出来，塞向画面右侧一个明显更小更旧的侧门。

Suggested elements:
长纸条和剪刀 / 三个并排窄闸门 / 卡住冒烟的闸门 / 一个破旧侧门

Chinese handwritten labels:
剪成一捆捆 / 一起挤 / 卡住了 / 换个小门

Color use:
Black for main line art and 小黑. Orange for main flow/path/arrows. Red only for key warnings/problems/results. Blue only for secondary notes or feedback/system state.

Constraints:
One image explains only one core structure. Keep the main subject around 40%-60% of the canvas. Preserve at least 35% blank white space. Use at most 5-8 short handwritten Chinese labels. Do not write a title in the top-left corner. Do not write the structure type on the image. Do not make it a formal diagram, course slide, or dense explainer. Do not copy prior examples or reuse known case compositions unless explicitly requested; invent a fresh visual metaphor for this specific article. It should be clear but not instructional, interesting but not childish, strange but clean.
```

---

## 4. 服务端二次校验：不信任 AI 输出（AI 漏判仍被打回）

Structure: 前后对比

```text
Generate one standalone 16:9 horizontal Chinese article illustration.

Visual DNA:
Pure white background. Minimalist black hand-drawn line art. Slightly wobbly pen lines. Lots of empty white space. Sparse red/orange/blue handwritten Chinese annotations. Clean absurd product-sketch feeling. No gradients, no shadows, no paper texture, no complex background, no commercial vector style, no PPT infographic look, no cute mascot poster, no children's illustration, no realistic UI.

Recurring IP character required:
小黑, a small solid-black absurd creature with white dot eyes, tiny thin legs, blank serious expression, slightly uneven hand-drawn body shape. 小黑 must perform the core conceptual action, not decorate the scene. Make 小黑 serious, deadpan, and slightly bizarre, not cute.

Theme:
第一道关放行的东西，第二道关的小黑照样重新称一遍，不管前面盖没盖章

Structure type:
前后对比

Core idea:
画面左边一个模糊的印章机器已经给一排纸片盖了"通过"的章；右边小黑坐镇第二道关卡，拿着秤重新称每一张纸片，其中一张明明已经盖过章，仍被小黑称重后扔进旁边的"打回"箱子

Composition:
画面左侧一台简单的盖章机器（虚线、模糊，表示不完全信任），下面一排纸片，每张都盖了圆形印章。画面右侧小黑坐在一个小秤台前，手里拿着一张纸片正在称重，秤的指针明显偏向"不合格"一侧；旁边一个写着"打回"的箱子里已经有一两张同样盖过章的纸片。

Suggested elements:
模糊的盖章机器 / 一排盖章纸片 / 小黑和一个手持秤 / 一个打回箱子

Chinese handwritten labels:
盖过章也没用 / 重新称一遍 / 打回

Color use:
Black for main line art and 小黑. Orange for main flow/path/arrows. Red only for key warnings/problems/results. Blue only for secondary notes or feedback/system state.

Constraints:
One image explains only one core structure. Keep the main subject around 40%-60% of the canvas. Preserve at least 35% blank white space. Use at most 5-8 short handwritten Chinese labels. Do not write a title in the top-left corner. Do not write the structure type on the image. Do not make it a formal diagram, course slide, or dense explainer. Do not copy prior examples or reuse known case compositions unless explicitly requested; invent a fresh visual metaphor for this specific article. It should be clear but not instructional, interesting but not childish, strange but clean.
```

---

## 5. 流式 NDJSON 进度，而非一次性返回大结果

Structure: Workflow

```text
Generate one standalone 16:9 horizontal Chinese article illustration.

Visual DNA:
Pure white background. Minimalist black hand-drawn line art. Slightly wobbly pen lines. Lots of empty white space. Sparse red/orange/blue handwritten Chinese annotations. Clean absurd product-sketch feeling. No gradients, no shadows, no paper texture, no complex background, no commercial vector style, no PPT infographic look, no cute mascot poster, no children's illustration, no realistic UI.

Recurring IP character required:
小黑, a small solid-black absurd creature with white dot eyes, tiny thin legs, blank serious expression, slightly uneven hand-drawn body shape. 小黑 must perform the core conceptual action, not decorate the scene. Make 小黑 serious, deadpan, and slightly bizarre, not cute.

Theme:
不是憋到最后甩出一大包结果，而是每处理一点就吐一张小纸条出来

Structure type:
Workflow

Core idea:
小黑站在一根细长水管前，不断把小纸卷一个个塞进管子，每塞一个，水管另一端就弹出一张小纸条（代表进度事件），排成一条队伍；最后管子里弹出一张略大、盖了章的纸条（代表最终结果）

Composition:
画面左侧小黑手里抱着一叠小纸卷，正往一根细水管里逐个塞入。水管中间用橙色箭头表示流动方向。水管右端不断弹出一张张小纸条，落在地上排成一条线；队伍末尾有一张明显更大、边缘盖了章的纸条，代表最后的总结。

Suggested elements:
细长水管 / 一叠小纸卷 / 一排陆续弹出的小纸条 / 末尾盖章的大纸条

Chinese handwritten labels:
塞一个 / 吐一个 / 不憋到最后 / 最后盖章收尾

Color use:
Black for main line art and 小黑. Orange for main flow/path/arrows. Red only for key warnings/problems/results. Blue only for secondary notes or feedback/system state.

Constraints:
One image explains only one core structure. Keep the main subject around 40%-60% of the canvas. Preserve at least 35% blank white space. Use at most 5-8 short handwritten Chinese labels. Do not write a title in the top-left corner. Do not write the structure type on the image. Do not make it a formal diagram, course slide, or dense explainer. Do not copy prior examples or reuse known case compositions unless explicitly requested; invent a fresh visual metaphor for this specific article. It should be clear but not instructional, interesting but not childish, strange but clean.
```
