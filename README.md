# Installable Online Sudoku

This is an [installable online Sudoku web application](https://johnwu-pro.github.io/sudoku/index.html).

+ Designed for playing on mobile devices,
+ Usable as a normal web application (a.k.a. webpage or website) on your desktop or mobile phone,
+ Installable to your desktop or mobile home screen as a [progressive web apps](https://web.dev/progressive-web-apps/) (PWA).

# Features
While the initial goal of the application is to replace pencil and eraser while playing Sudoku,
it's been developed and enhanced with the following features:

#### Built-in features
+ Pause (and save state) when leaving or closing the webapp/page;
+ Resume when switching back or re-launching the webapp/page;
+ On startup:
  + Continue where you left off (restore and resume), or
  + Start a new game of the selected level or mode.

#### Toggleable features
+ Allow Undo
+ Check Correctness by Rules
+ Count Solved Numbers
+ Eliminate by Row, Column, and Box
+ Highlight Solved Same Value
+ Mark Cross-Hatching
+ Mark Eliminated
+ Trace Assumptions

# The Online Game
The game is accessible at https://johnwu-pro.github.io/sudoku/index.html.

# Project Development
#### Setup
The [http-server](https://github.com/http-party/http-server) is used for local development and manual testing.

To install http-server (globally):
```
npm install --global http-server
```

To setup local directory structure
```
# Windows commands
cd <project-dir>
mkdir ..\http-server.public
mklink /J ..\http-server.public\sudoku .
```
OR
```
# Linux/Unix commands
cd <project-dir>
mkdir -p ../http-server.public
ln ./ ../http-server.public/sudoku/
```

#### Running locally
```
http-server ../http-server.public/ -c30 -p 9088

# then, open http://localhost:9088/sudoku/index.html
```

#### Deploy / Publish
1. Push the changes to remote (`git@github.com:JohnWu-Pro/sudoku.git`).
2. Open https://johnwu-pro.github.io/sudoku/index.html?v=123.
   * NOTE: Using `?v=<random-number>` to workaround issues caused by caching to page `index.html`.

# References
+ https://www.sudopedia.org/
+ https://qqwing.com/
