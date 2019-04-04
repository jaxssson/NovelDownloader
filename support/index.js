const Fetcher = require('./Fetcher'),
	Writer = require('./Writer'),
	path = require('path'),
	cheerio = require('cheerio');	// 处理DOM

const TXT_PATH = path.resolve(__dirname, '../public/txt');	// 输出txt的目录

class Downloader {
	constructor(url, emitter) {
		this.url = url;	// 章节页url
		this.filePath = '';	// 输出文件路径
		this.title = '';	// 小说标题
		this.chapterUrls = [];	// 章节url
		this.chapterContents = []; // 章节内容
		this.fetcher = new Fetcher(emitter);
		this.writer = null;
		this.emitter = emitter;	// 传输状态的方法
	}

	// 爬取小说
	async download() {
		this.emitter.emit('stateChange', 'requesting outer page');
		const outerHtml = await this.fetcher.fetchOuterPage(this.url);
		// 如果没有返回内容，即出错，中断任务
		if (!outerHtml) {
			return;
		}
		this.emitter.emit('stateChange', 'getting content urls');
		this.getChapterUrl(outerHtml);
		// 如果chapter urls的长度为0，说明url有误
		if (+this.chapterUrls.length === 0) {
			this.emitter.failure('url invalid');
			return;
		}
		this.emitter.emit('stateChange', 'getting chapter content');
		this.chapterContents = await this.fetcher.fetchInnerPages(this.chapterUrls, Downloader.handlerInnerContent);
		// 如果没有返回内容数组，即出错，中断任务
		if (!this.chapterContents) {
			this.emitter.failure('get content failure');
			return;
		}
		this.filePath = path.resolve(TXT_PATH, `${this.title}.txt`);	// 以书名命名文件
		this.writer = new Writer(this.filePath, this.chapterContents, this.emitter);
		this.emitter.emit('stateChange', 'writing txt');
		await this.writer.write().catch(err => {
			this.emitter.failure('write txt failure');
		});	// 生成txt文件
		this.emitter.emit('success', 'done');
		return {
			innerUrl: this.url,
			title: this.title,
		}
	}

	// 根据请求来的chapter页内容拿到章节url
	getChapterUrl(html) {
		const $ = cheerio.load(html);
		this.title = $('h1', '.btitle').text();	// 拿到书名
		$('a', '.chapterlist').each((index, element) => {
			const chapterUrl = `https://www.haxtxt.net${$(element).attr('href')}`;
			this.chapterUrls.push(chapterUrl);
		});
	}

	// 从每个内页中拿到内容
	static handlerInnerContent(html) {
		const $ = cheerio.load(html, {decodeEntities: false});
		return $('#BookText').html().split('<br>').join('\r\n');
	}
}

module.exports = Downloader;