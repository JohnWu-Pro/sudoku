# Overview

# TODO
v Display and styling the grid
v Eliminate by rules
v Assumptions
v Prompt
v Manual seed
v Fetch seed
v Menu
v Fix Assumptions Reject
v Highlight Cross Hatching
v Undo
v Restart
. icon
x Highlight row, column, and box?
+ Timer, pause & resume
+ Timer font
+ Enhance Highlight Cross Hatching (for cells in same box)
? When app/page deactivated/closed ???
+ Freeze/cover the game board when timer paused, and
  + touch to resume
+ On success
+ Flash on timer resume and on success
+ Rolling title and game level
+ Save & restore/resume when re-entering
v Polishing command buttons
+ Polishing command symbols
+ Stats
+ References
+ i18n
+ PWA

# References
+ https://qqwing.com/generate.html - generator
+ https://github.com/stephenostermiller/qqwing

+ http://norvig.com/sudoku.html - solving approach
- https://github.com/einaregilsson/sudoku.js
- https://github.com/tshrestha/js-sudoku

+ https://www.geeksforgeeks.org/program-sudoku-generator/ - improved generation approach

+ https://github.com/huaminghuangtw/Web-Sudoku-Puzzle-Game
+ https://github.com/robatron/sudoku.js

+ http://sudopedia.enjoysudoku.com/Diagrams_and_Notations.html - Notations
+ https://sudoku.game/ - Help text
+ https://www.websudoku.com/ - seed

# Setup
The [http-server](https://github.com/http-party/http-server) is used for local development and manual testing.

To install http-server (globally):
```
npm install --global http-server
```

# Running Locally
```
http-server
```

# Package
```bash
./package.sh
```

# Deploy
```bash
export SSH_USERNAME=<your-ssh-username>

export SERVER=prod.ejfun.com
# OR
export SERVER=qa.ejfun.com

export HTML_APP=sudoku

# Copy target ZIP to the server
ssh $SSH_USERNAME@$SERVER "sudo -- bash -c '\
mkdir -p /tmp/ejfun; \
chmod -R 777 /tmp/ejfun \
'"
scp -p target/$HTML_APP.zip $SSH_USERNAME@$SERVER:/tmp/ejfun/$HTML_APP.TBD.zip

# SSH to the server, and deploy
ssh $SSH_USERNAME@$SERVER "sudo /opt/ejfun/app/deploy-html.sh $HTML_APP"
```
