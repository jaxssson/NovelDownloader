const request = require('request-promise'),	// promise版的request，返回promise对象
	iconv = require('iconv-lite');	// buffer编码用

// 请求内页失败时，尝试次数
const FETCH_TIMES = 4;
const TIME_OUT = 15000;

const options = {
	// 编码工作放到transform中完成
	encoding: null,
	// 为true并且header里Accept-Encoding中有gzip的话，可接收gzip格式，节约带宽
	gzip: true,
	// 设置超时时间
	timeout: TIME_OUT,
	headers: {
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
		'Accept-Encoding': 'gzip, deflate, br',
		'Accept-Language': 'zh-CN,zh;q=0.9',
		'Connection': 'keep-alive',
		'Host': 'www.haxtxt.net',
		'Upgrade-Insecure-Requests': '1',
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36'
	},
	transform(body, res) {
		// 响应头中是否包含content-type信息，如果没有就默认为utf8
		const hasCharset = res.headers['content-type'].match(/(?:charset=)([\w-]+)/);
		const charset = hasCharset ? hasCharset[1].replace(/-/, '') : 'utf8';
		// 对buffer编码
		return iconv.decode(body, charset);
	}
};

class Fetcher {
	constructor(emitter) {
		this.emitter = emitter;
	}

	// 获取外页内容并进行异常处理
	async fetchOuterPage(url) {
		return await Fetcher.fetch(url)
			.catch(err => {
				this.emitter.failure(`get outer page failure, statusCode: ${err.statusCode}`);
			});
	}

	// 请求所有内页的内容
	async fetchInnerPages(urls, handler) {
		const promises = [];
		let doneNum = 0;
		urls.forEach((url, chapter) => {
			promises.push(
				// push一个新的promise，在请求内页的promise失败时，catch住并resolve
				new Promise(resolve => {
					this
						.fetchOnePage(url, FETCH_TIMES, (body) => {
							doneNum++;
							this.emitter.emit('processChange', {
								msg: `requesting chapter ${doneNum} / ${urls.length}`,
								done: doneNum === +urls.length,
							});
							return handler(body);
						})
						// 如果成功，直接resolve，将结果传入本promise
						.then(resolve)
						// 如果失败，本promise要resolve一个提示信息来替代
						.catch(err => {
							console.log('outer err');
							this.emitter.emit('stateChange', `获取第${+chapter + 1}章失败`);
							resolve(`获取第${+chapter + 1}章失败`);
						})
				})
			);
		});
		return await Promise.all(promises);
	}

	/**
	 * 请求每一个章节
	 * @param url 章节url
	 * @param times    请求不成功时，重新请求的次数
	 * @param handler    请求成功后处理请求内容的函数
	 * @returns {*}    返回Promise对象
	 */
	fetchOnePage(url, times, handler) {
		const promise = Fetcher.fetch(url, handler);
		if (times > 0) {
			times--;
			return new Promise(resolve => {
				promise.then(resolve).catch((err) => {
					resolve(this.fetchOnePage(url, times));
				})
			});
		}
		return promise;
	}

	// 请求页内容
	static async fetch(url, handler) {
		return request(Object.assign(options, {uri: url}))
			.then(body => {
				return handler ? handler(body) : body;
			});
	}

}

module.exports = Fetcher;