// function defaultTask(cb) {
//     // place code for your default task here
//     cb();
//   }

//   exports.default = defaultTask

import gulp from 'gulp';
import yargs from 'yargs';
import sass from 'gulp-sass';
import cleanCss from 'gulp-clean-css';
import gulpif from 'gulp-if';
import sourcemaps from 'gulp-sourcemaps';
import imagemin from 'gulp-imagemin';
import del from 'del';
import webpack from 'webpack-stream';
import uglify from 'gulp-uglify';
import named from 'vinyl-named';
import browserSync from 'browser-sync';


const server = browserSync.create();
const PRODUCTION = yargs.argv.prod;
const paths = {
  styles: {
    src: ['src/assets/sass/main.scss', 'src/assets/sass/admin.scss'],
    dest: 'dist/assets/css/'
  },
  images: {
    src: 'src/assets/img/**/*.{jpg,png,svg,gif}',
    dest: 'dist/assets/images'
  },
  scripts: {
    src: ['src/assets/js/app.js', 'src/assets/js/admin.js'],
    dest: 'dist/assets/js'
  },
  other: {
    src: ['src/assets/**/*', '!src/assets/{img,js,sass,css}', '!src/assets/{img,js,sass,css}/**/*'],
    dest: 'dist/assets'
  }
}

export const styles = () => {
  return gulp.src(paths.styles.src)
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(PRODUCTION, cleanCss({
      compatibility: 'ie8'
    })))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
    .pipe(gulp.dest(paths.styles.dest));
}

export const images = () => {
  return gulp.src(paths.images.src)
    .pipe(gulpif(PRODUCTION, imagemin()))
    .pipe(gulp.dest(paths.images.dest));
}

export const copy = () => {
  return gulp.src(paths.other.src)
    .pipe(gulp.dest(paths.other.dest));
}

export const clean = () => del(['dist']);

export const scripts = () => {
  return gulp.src(paths.scripts.src)
    .pipe(named())
    .pipe(webpack({
      module: {
        rules: [{
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }]
      },
      output: {
        filename: '[name].js'
      },
      externals:{
        jquery: 'jQuery'
      },
      devtool: !PRODUCTION ? 'inline-source-map': false
    }))
    .pipe(gulpif(PRODUCTION, uglify()))
    .pipe(gulp.dest(paths.scripts.dest));
}

export const serve =(done) =>{
  server.init({
    proxy: "http://localhost/wordpress/"
  });
  done();
}

export const reload = (done)=>{
  server.reload(); 
  done();
}

export const watch = () => {
  gulp.watch('src/assets/sass/**/*.scss',gulp.series( styles,reload));
  gulp.watch('src/assets/js/**/*.js', gulp.series( scripts ,reload));
  gulp.watch('**/*.php', reload);
  gulp.watch(paths.images.src, gulp.series( images,reload));
  gulp.watch(paths.other.src, gulp.series( copy,reload))
}


export const dev = gulp.series(clean, gulp.parallel(styles,scripts, images, copy),serve, watch);
export const build = gulp.series(clean, gulp.parallel(styles, images, copy));

export default dev;