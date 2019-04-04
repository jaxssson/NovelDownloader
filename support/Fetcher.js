const request = require('request-promise'),	// promise版的request，返回promise对象
	iconv = require('iconv-lite');	// buffer编码用


const options = {
	// 编码工作放到transform中完成
	encoding: null,
	// 为true并且header里Accept-Encoding中有gzip的话，可接收gzip格式，节约带宽
	gzip: true,
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

	// 请求页内容
	async fetch(url, handler) {
		return request(Object.assign(options, {uri: url}))
			.then(body => {
				return handler ? handler(body) : body;
			})
			.catch(err => {
				this.emitter.failure(`get page failure, statusCode: ${err.statusCode}`);
			});
	}

	// 请求所有内页的内容
	async fetchInnerPages(urls, handler) {
		const promises = [];
		let doneNum = 0;
		urls.forEach(url => {
			promises.push(this.fetch(url, (body) => {
				doneNum++;
				this.emitter.emit('processChange', {
					msg: `requesting chapter ${doneNum} / ${urls.length}`,
					done: doneNum === +urls.length,
				});
				return handler(body)
			}));
		});
		return await Promise.all(promises);
	}
}

module.exports = Fetcher;