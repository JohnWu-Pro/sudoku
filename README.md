# Overview

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
```
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
