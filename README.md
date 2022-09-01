## Introduction

TiddlyBrain is based on [TiddlyWiki](https://tiddlywiki.com/).

## How to install

### Prerequisites

Linux machine or Windows WSL with node.js installed.

### Steps

1. Install Tiddlywiki: `$ sudo npm install -g tiddlywiki`
2. Clone TiddlyBrain repository: `$ git clone https://github.com/tiddlybrain/tiddlybrain.git ~/tiddlybrain`
3. Create a directory to hold all your notes: `$ mkdir ~/notes`
4. Create stuctures inside of your directory like the following:
	1. `$ mkdir -p ~/notes/files`
	2. `$ ln -s ~/tiddlybrain/plugins ~/notes/plugins`
	3. `$ ln -s ~/tiddlybrain/tiddlywiki.info ~/notes/tiddlywiki.info `
	4. `$ mkdir -p ~/notes/tiddlers`
	5. `$ ln -s ~/tiddlybrain/customize ~/notes/tiddlers/customize`
	6. `$ cp -r ~/tiddlybrain/site ~/notes/tiddlers/`
5. Start the node.js server: `tiddlywiki ~/notes --listen port=8081 gzip=yes`
