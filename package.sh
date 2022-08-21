#!/bin/bash

export HTML_APP=sudoku

mkdir -p target
rm -f target/$HTML_APP.zip
zip -r target/$HTML_APP.zip ./ -x .gitignore README.md package.sh 'target/*'
