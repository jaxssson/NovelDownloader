let cache = require('../cache');	// 缓存json
const fs = require('fs'),
	path = require('path'),
	Fetcher = require('../support/index');

// 缓存文件路径
const CACHE_PATH = path.resolve(__dirname, '../cache.json');

class Emitter {
	constructor(socket) {
		this.socket = socket;
	}
	// 向客户端发送信息
	emit(type, msg) {
		this.socket.emit(type, msg);
	}
	// 失败信息
	failure(msg) {
		this.socket.emit('failure', msg);
		this.socket.disconnect(false);
	}
}

class Controler {
	constructor(socket) {
		this.url = '';
		this.socket = socket;
		this.emitter = new Emitter(socket);
		this.fetcher = null;
		this.novelInfo = {};
	}

	async start(url) {
		// 如果url非法，直接返回
		if (!Controler.isUrlValid(url)) {
			this.emitter.failure('url invalid');
			return;
		}
		this.url = Controler.handleUrl(url);	// url处理成内页url
		// 如果在缓存中
		let novelTitle;
		if (novelTitle = Controler.hasCache(this.url)) {
			this.emitter.emit('success', 'in cache, done');
		}
		// 如果不在缓存中，进行爬取
		else{
			this.fetcher = new Fetcher(this.url, this.emitter);
			this.novelInfo = await this.fetcher.download();
			if (!this.novelInfo) {
				throw new Error('get failure');
			}
			novelTitle = this.novelInfo.title;
			cache.data.push(this.novelInfo);
			Controler.updateCache();
		}
		return novelTitle;
	}

	// 检测url是否有效
	static isUrlValid(url) {
		return /www.haxtxt.net\/files\/article\/\S+?.html?$/.test(url);
	}

	// 判断用户输入url是info页还是chapter页的，拿到chapter页的url
	static handleUrl(url) {
		const isOuter = /info\S+\.htm?/.test(url);
		return isOuter ? url.replace(/info/, 'html').replace(/\.htm$/, '/index.html') : url;
	}

	// 是否有cache，如果有直接返回书名
	static hasCache(url) {
		for (let i = 0; i < cache.data.length; i++) {
			if (cache.data[i].innerUrl === url) {
				return cache.data[i].title;
			}
		}
		return false;
	}

	// 更新缓存
	static updateCache() {
		const options = {
			encoding: 'utf8',
			flag: 'w',
		};
		const json = JSON.stringify(cache, null, 2);
		fs.writeFile(CACHE_PATH, json, options, (err) => {
			if (err) {
				throw err;
			}
		});
	}
}

module.exports = Controler;