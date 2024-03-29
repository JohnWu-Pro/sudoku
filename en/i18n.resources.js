'use strict';

((i18n) => { window.T = i18n, i18n.translator.add({

values: {
  "app.name": "Sudoku",
  "app.upgrade": "Upgrade to",

  "game.title": "Sudoku",
  "game.selection.filling-in-givens": "Filling in Givens",
  "game.selection.level-simple": "Level: Simple",
  "game.selection.level-easy": "Level: Easy",
  "game.selection.level-intermediate": "Level: Intermediate",
  "game.selection.level-expert": "Level: Expert",
  "game.selection.level-shared": "Level: Shared",
  "game.selection.imported-givens": "Imported Givens",
  "game.selection.manual-givens": "Manual Givens",

  "game.completion-message.simple": "That was simple!",
  "game.completion-message.easy": "That was easy!",
  "game.completion-message.intermediate": "That wasn't difficult!",
  "game.completion-message.expert": "I'm an expert!",
  "game.completion-message.shared": "The givens were from shared.",
  "game.completion-message.import": "The givens were imported.",
  "game.completion-message.manual": "The givens were manully filled in.",

  "game.congratulations": "%{completion-message}<br>Solved in %{duration}.",

  "game.new.placeholder": "New Game ...",
  "game.new.simple": "Simple",
  "game.new.easy": "Easy",
  "game.new.intermediate": "Intermediate",
  "game.new.expert": "Expert",
  "game.new.import": "Import Givens from Clipboard",
  "game.new.manual": "Manually Filling in Givens",

  "game.button.undo": "Undo",
  "game.button.eliminate-by-rules": "Eliminate by Row, Column, and Box",
  "game.button.givens-filled": "Givens are Ready",
  "game.button.mark-cross-hatching": "Mark Cross-Hatching",
  "game.button.erase": "Erase",

  "game.info.input-givens-then-click-done": "Input the givens, then click '%{button}'.",
  "game.info.more-auxiliary-functions": "Tap the cell for more auxiliary functions.",

  "board.assume.placeholder": "Assume %{cell} is ...",
  "board.assume.cell-is": "Assume %{cell} is %{value}",
  "board.assumption.button.accept": "Accept",
  "board.assumption.button.reject": "Reject",
  "board.assumption.accepted": "Accepted '%{cell} is %{value}'.",
  "board.assumption.accepted-and-predecessors": "Accepted '%{cell} is %{value}' and its predecessor(s).",
  "board.assumption.rejected": "Rejected '%{cell} is %{value}'.",
  "board.assumption.rejected-and-successors": "Rejected '%{cell} is %{value}' and its successor(s).",

  "board.house.row": "row",
  "board.house.column": "column",
  "board.house.box": "box",

  "board.info.no-more-undo": "No more step to undo!",
  "board.error.cell-duplicated-in-house": "Cell %{cell} value '%{value}' is duplicated in its %{house-type}.",
  "board.error.no-candidate": "No candidate found.",
  "board.warn.max-3-assumptions": "Maximum 3 assumptions are supported!",

  "settings.title": "Settings",

  "settings.on-startup": "On startup",
  "settings.on-startup.resume": "Continue where you left off",
  "settings.on-startup.start-simple": "Start a Simple Level Sudoku",
  "settings.on-startup.start-easy": "Start an Easy Level Sudoku",
  "settings.on-startup.start-intermediate": "Start a Intermediate Level Sudoku",
  "settings.on-startup.start-expert": "Start an Expert Level Sudoku",
  "settings.on-startup.start-manual": "Start Manually Filling in Givens",

  "settings.auxiliary-features": "Auxiliary features",
  "settings.auxiliary-features.more": "More (Easier to Play)",
  "settings.auxiliary-features.less": "Less (More Difficult to Play)",
  "settings.auxiliary-features.least": "Least (Challenging)",

  "settings.switch.allow-undo": "Allow Undo",
  "settings.switch.check-correctness-by-rules": "Check Correctness By Rules",
  "settings.switch.count-solved-numbers": "Count Solved Numbers",
  "settings.switch.eliminate-by-rules": "Eliminate by Row, Column, and Box",
  "settings.switch.highlight-solved-same-value": "Highlight Solved Same Value",
  "settings.switch.mark-cross-hatching": "Mark Cross Hatching",
  "settings.switch.mark-eliminated": "Mark Eliminated",
  "settings.switch.trace-assumptions": "Trace Assumptions",

  "settings.share": "Share",
  "settings.share.including-current-givens": "Including Current Givens",

  "install.add-to-home-screen": "Add to Home Screen",
  "install.demo.acknowledge": "Got it!",

  "footer.copyright": "Copyright",
  "footer.owner": "John Wu",
  "footer.license": "License",
  "footer.licensed-under": "Licensed under the",
}

}) })(i18n)
