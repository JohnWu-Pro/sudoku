'use strict';

((i18n) => { window.T = i18n, i18n.translator.add({

values: {
  "app.name": "数独",
  "app.upgrade": "刷新并升级到",

  "game.title": "数独",
  "game.selection.filling-in-givens": "填写初盘",
  "game.selection.level-simple": "级别: 初级",
  "game.selection.level-easy": "级别: 容易",
  "game.selection.level-intermediate": "级别: 中级",
  "game.selection.level-expert": "级别: 专家级",
  "game.selection.level-shared": "级别: 分享的",
  "game.selection.imported-givens": "导入初盘",
  "game.selection.manual-givens": "手工输入初盘",

  "game.completion-message.simple": "太初级了!",
  "game.completion-message.easy": "简单!",
  "game.completion-message.intermediate": "也不难!",
  "game.completion-message.expert": "我是专家!",
  "game.completion-message.shared": "初盘是分享的.",
  "game.completion-message.import": "初盘是导入的.",
  "game.completion-message.manual": "初盘是手工输入的",

  "game.congratulations": "%{completion-message}<br>耗时 %{duration} 搞定.",

  "game.new.placeholder": "开始新的 ...",
  "game.new.simple": "初级",
  "game.new.easy": "容易",
  "game.new.intermediate": "中级",
  "game.new.expert": "专家级",
  "game.new.import": "从剪贴板导入",
  "game.new.manual": "手工输入",

  "game.button.undo": "回退",
  "game.button.eliminate-by-rules": "依据 行/列/宫 排除",
  "game.button.givens-filled": "初盘输入完毕",
  "game.button.mark-cross-hatching": "标注交叉排除影线",
  "game.button.erase": "擦除",

  "game.info.input-givens-then-click-done": "输入初盘, 然后点击 '%{button}'.",
  "game.info.more-auxiliary-functions": "点击单元格可见更多辅助功能.",

  "board.assume.placeholder": "假定 %{cell} 是 ...",
  "board.assume.cell-is": "假定 %{cell} 是 %{value}",
  "board.assumption.button.accept": "认可",
  "board.assumption.button.reject": "否定",
  "board.assumption.accepted": "已认可 '%{cell} 是 %{value}'.",
  "board.assumption.accepted-and-predecessors": "已认可 '%{cell} 是 %{value}' 及其之前的假定.",
  "board.assumption.rejected": "已否定 '%{cell} 是 %{value}'.",
  "board.assumption.rejected-and-successors": "已否定 '%{cell} 是 %{value}' 及其之后的假定.",

  "board.house.row": "行",
  "board.house.column": "列",
  "board.house.box": "宫",

  "board.info.no-more-undo": "无法再回退了!",
  "board.error.cell-duplicated-in-house": "单元格 %{cell} 的值 '%{value}' 在其所在 %{house-type} 内有重复.",
  "board.error.no-candidate": "找不到候选数.",
  "board.warn.max-3-assumptions": "最多支持3层假定!",

  "settings.title": "设置",

  "settings.on-startup": "每次启动时",
  "settings.on-startup.resume": "从上次中断的地方继续",
  "settings.on-startup.start-simple": "开始一个初级数独",
  "settings.on-startup.start-easy": "开始一个简单数独",
  "settings.on-startup.start-intermediate": "开始一个中级数独",
  "settings.on-startup.start-expert": "开始一个专家级数独",
  "settings.on-startup.start-manual": "开始手工输入初盘",

  "settings.auxiliary-features": "辅助功能",
  "settings.auxiliary-features.more": "较多辅助 (更容易玩)",
  "settings.auxiliary-features.less": "较少辅助 (比较难玩)",
  "settings.auxiliary-features.least": "极少辅助 (非常有挑战性)",

  "settings.switch.allow-undo": "允许撤消",
  "settings.switch.check-correctness-by-rules": "依据规则查验正确性",
  "settings.switch.count-solved-numbers": "计数已确定的数",
  "settings.switch.eliminate-by-rules": "依据 行/列/宫 排除",
  "settings.switch.highlight-solved-same-value": "突出显示已确定的相同的数",
  "settings.switch.mark-cross-hatching": "标注交叉排除影线",
  "settings.switch.mark-eliminated": "标注已排除的",
  "settings.switch.trace-assumptions": "支持并跟踪假定",

  "settings.share": "分享",
  "settings.share.including-current-givens": "包含当前数独初盘",

  "install.add-to-home-screen": "安装到桌面",
  "install.demo.acknowledge": "已了解!",

  "footer.copyright": "版权所有",
  "footer.owner": "吴菊华",
  "footer.license": "版权许可",
  "footer.licensed-under": "适用版权许可",
}

}) })(i18n)
