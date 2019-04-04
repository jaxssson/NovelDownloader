const socketio = require('socket.io'),
	Controler = require('./controler');

class Socket {
	constructor(server) {
		this.server = server;
		this.io = null;
	}

	// websocket开始监听
	listen() {
		this.io = socketio.listen(this.server);
		this.io.sockets.on('connection', socket => {
			let controler = new Controler(socket);
			socket.on('url', url => {
				controler.emitter.emit('stateChange', 'url received');
				controler.start(url)
					.then(title => {
						controler.emitter.emit('file', title);
						Socket.closeSocket(socket);
					})
					.catch(err => {});
			});
			socket.on('disconnect', function () {
				controler = null;
			});
		});
	}

	// websocket停止监听
	stop() {
		this.io.close();
		this.io = null;
	}

	// 断开socket连接
	static closeSocket(socket) {
		socket.disconnect(false);
	}
}

module.exports = Socket;