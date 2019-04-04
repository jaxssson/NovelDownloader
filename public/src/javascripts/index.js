const input = document.getElementById("input"),
	submit = document.getElementById("submit");

const downloadContent = document.getElementById("download-content"),
	downloader = document.getElementById("downloader"),
	txtTitle = document.getElementById("txt-title");

const messageContent = document.getElementById("message-content");

let socket;

submit.addEventListener('click', () => {
	messageContent.innerHTML = '';
	downloadContent.style.display = 'none';
	if (isUrlValid()) {
		connectSocket();
	}
	else{
		addMessage('url无效', 2);
	}
});

// 检测即将提交的url是否有效
function isUrlValid() {
	return /www.haxtxt.net\/files\/article\/\S+?.html?$/.test(input.value);
}

// 建立webSocket连接并发送url
function connectSocket() {
	let processDom = null;
	socket = io.connect('http://localhost:10010');
	socket.on('connect', () => {
		addMessage('webSocket connected');
		submit.disabled = 'disabled';
	});
	socket.on('disconnect', () => {
		addMessage('webSocket closed');
		submit.disabled = '';
	});
	socket.on('stateChange', data => {
		addMessage(data);
	});
	socket.on('processChange', data => {
		processDom = addProcess(data, processDom);
	});
	socket.on('success', data => {
		addSuccessMessage(data);
	});
	socket.on('failure', data => {
		addFailureMessage(data);
	});
	socket.on('file', file => {
		if (file) {
			addDownload(file);
		}
	});
	// 发送url
	socket.emit('url', input.value);
}

// 加入状态变化消息
function addMessage(msg, color = '#000000') {
	const li = document.createElement('li');
	li.innerText = msg;
	li.style.color = color;
	messageContent.appendChild(li);
}

// 加入成功消息
function addSuccessMessage(msg) {
	addMessage(msg, '#0000ff');
}

// 加入失败消息
function addFailureMessage(msg) {
	addMessage(msg, '#ff0000');
}

// 加入进度变化消息
function addProcess(data, processDom) {
	if (!processDom) {
		processDom = document.createElement('li');
		messageContent.appendChild(processDom);
	}
	processDom.innerText = data.msg;

	return data.done ? null : processDom;
}

// 加入下载
function addDownload(file) {
	downloadContent.style.display = 'block';
	downloader.download = file;
	downloader.href = `/txt/${file}.txt`;
	txtTitle.innerText = file;
}