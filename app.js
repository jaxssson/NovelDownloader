// express相关组件
const express = require('express'),
	createError = require('http-errors'),
	cookieParser = require('cookie-parser'),
	logger = require('morgan'),
	favicon = require('serve-favicon');

const path = require('path'),
	Socket = require('./server/socket'),
	indexRouter = require('./routes/index');

const app = express();
// 把Socket放到app的变量中去
app.locals.Socket = Socket;

// 判断环境以及设置静态资源目录
const IS_DEV_ENV = app.get('env') === 'development';

// 设置view模板以及位置
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 使用中间件
app.use(favicon(path.join(__dirname, 'public', 'favicon.jpg')));	// 设置小图标
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// 捕获404并送到错误处理程序
app.use((req, res, next) => {
	next(createError(404));
});

// 错误处理程序
app.use(function (err, req, res, next) {
	// 设置局部变量，只在开发环境中提供错误
	res.locals.message = err.message;
	res.locals.error = IS_DEV_ENV ? err : {};

	// 渲染错误页面
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
