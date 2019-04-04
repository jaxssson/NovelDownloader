const gulp = require('gulp'),
	path = require('path'),
	babel = require('gulp-babel'),
	uglify = require('gulp-uglify'),
	minify = require('gulp-minify-css');

const PUBLIC_PATH = path.resolve(__dirname, 'public');

gulp.task('js', () => {
	return gulp.src(`${PUBLIC_PATH}\\src\\javascripts\\*.js`, {base: `${PUBLIC_PATH}\\src`})
		.pipe(babel())
		.pipe(uglify())
		.pipe(gulp.dest(`${PUBLIC_PATH}\\dest`));
});

gulp.task('css', () => {
	return gulp.src(`${PUBLIC_PATH}\\src\\stylesheets\\*.css`, {base: `${PUBLIC_PATH}\\src`})
		.pipe(minify())
		.pipe(gulp.dest(`${PUBLIC_PATH}\\dest`));
});

gulp.task('run', gulp.parallel('js', 'css'));