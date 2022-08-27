# Overview

# TODO
v Display and styling the grid
v Eliminate by rules
v Assumptions
v Prompt
v Manual seed
+ Fetch seed
+ icon
+ Undo
+ Menu
x Highlight row, column, and box?
+ Cross Hatching
+ Styling keys and commands
+ Timer
+ Stats
+ References
+ i18n

# References
+ https://github.com/tshrestha/js-sudoku
+ http://norvig.com/sudoku.html

+ https://github.com/huaminghuangtw/Web-Sudoku-Puzzle-Game
+ https://github.com/robatron/sudoku.js
+ https://qqwing.com/generate.html
+ https://www.geeksforgeeks.org/program-sudoku-generator/

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
