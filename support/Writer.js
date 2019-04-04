const fs = require('fs');

class Writer {
	constructor(path, content, emitter) {
		this.content = content;
		this.emitter = emitter;
		// 重名文件覆盖，utf8编码
		this.stream = fs.createWriteStream(path, {
			flags: 'w',
			encoding: 'utf8',
		});
	}
	async write() {
		const len = this.content.length;
		// 写入每一个段落都是一个promise任务
		const promises = [];
		let doneNum = 0;
		for (let i = 0; i < len; i++) {
			const content = this.content[i] ? this.content[i] : '获取章节出错';
			promises.push(this.writeOneChapter(content).then(data => {
				doneNum++;
				this.emitter.emit('processChange', {
					msg: `writing chapter ${doneNum} / ${len}`,
					done: doneNum === +len,
				});
				return data;
			}));
		}
		// 最后皮一下
		promises.push(this.writeOneChapter('Created By Jaxssson;'));
		this.stream.on('error', err => {
			this.emitter.failure('write stream err');
		});
		return Promise.all(promises);
	}
	// 写入一个章节，返回Promise对象
	async writeOneChapter(content) {
		return new Promise((resolve, reject) => {
			this.stream.write(`${content}\r\n`, () => {
				resolve();
			});
		})
	}
}

module.exports = Writer;