const {task, series, parallel, src, dest, watch} = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass')(require('sass'));
const dc = require('postcss-discard-comments');
const browserSync = require('browser-sync');
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const rename = require('gulp-rename');
const csscomb = require('gulp-csscomb');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const sortCSSmq = require('sort-css-media-queries');
const terser = require('gulp-terser');
const concat = require('gulp-concat');
const del = require('del');

const option = process.argv[3];

const PATH = {
  scssFolder: './assets/scss/',
  scssFiles: './assets/scss/**/*.scss',
  scssFile: './assets/scss/style.scss',
  cssFolder: './assets/css/',
  cssFiles: './assets/css/*.css',
  cssFile: './assets/css/style.css',
  htmlFolder: './',
  htmlFiles: './*.html',
  pugFiles: './*.pug',
  jsFolder: './assets/js/',
  jsFiles: ['./assets/js/**/*.js', '!./assets/js/**/bundle.js', '!./assets/js/**/*.min.js'],
  imgFolder: './assets/img/',
  jsBundleName: 'bundle.js'
};

const PLUGINS = [
  dc({ discardComments: true }),
  autoprefixer({
    overrideBrowserslist: [
      'last 5 versions',
      '> 0.1%'
    ],
    cascade: true
  }),
  mqpacker({sort: sortCSSmq})
];

function scss() {
  return src(PATH.scssFile)
    .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
    .pipe(postcss(PLUGINS))
    .pipe(csscomb())
    .pipe(dest(PATH.cssFolder))
    .pipe(browserSync.stream());
}
function scssMin() {
  return src(PATH.scssFile)
    .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
    .pipe(postcss(PLUGINS))
    .pipe(csscomb())
    .pipe(postcss([cssnano({preset: 'default'})]))
    .pipe(rename({suffix: '.min'}))
    .pipe(dest(PATH.cssFolder));
}
function scssDev() {
  return src(PATH.scssFile, {sourcemaps: true})
    .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
    .pipe(postcss(PLUGINS))
    .pipe(dest(PATH.cssFolder, {sourcemaps: true}))
    .pipe(browserSync.stream());
}

function comb() {
  return src(PATH.scssFiles)
    .pipe(csscomb())
    .pipe(dest(PATH.scssFolder));
}

function syncInit() {
  browserSync({
    server: {baseDir: './'},
    notify: false
  });
}

async function sync() {
  browserSync.reload();
}

function createStructure() {
  let file = [];
  let scssFiles = [];

  scssFiles[0] = `${PATH.scssFolder}style.scss`;
  scssFiles[1] = `${PATH.scssFolder}_variables.scss`;
  scssFiles[2] = `${PATH.scssFolder}_skin.scss`;
  scssFiles[3] = `${PATH.scssFolder}_common.scss`;
  scssFiles[4] = `${PATH.scssFolder}_footer.scss`;
  scssFiles[5] = `${PATH.scssFolder}_header.scss`;

  file[0] = `${PATH.htmlFolder}index.html`;
  file[1] = `${PATH.cssFolder}style.css`;
  file[2] = `${PATH.jsFolder}main.js`;
  file[3] = scssFiles;

  src('*.*', {read: false})
    .pipe(dest(PATH.scssFolder))
    .pipe(dest(PATH.cssFolder))
    .pipe(dest(PATH.jsFolder))
    .pipe(dest(PATH.imgFolder));

  return new Promise((resolve) => setTimeout(() => {
    for (let i = 0; i < file.length; i++) if (!Array.isArray(file[i])) {
      require('fs').writeFileSync(file[i], '');
      console.log(file[i]);
    } else for (let j = 0; j < file[i].length; j++) {
      require('fs').writeFileSync(file[i][j], '');
      console.log(file[i][j]);
    }


    resolve(true);
  }, 1000));
}

function concatJS() {
  return src(PATH.jsFiles)
    .pipe(concat(PATH.jsBundleName))
    .pipe(dest(PATH.jsFolder));
}

function minJS() {
  return src(PATH.jsFiles)
    .pipe(terser({
      toplevel: true,
      output: {
        quote_style: 3
      }
    }))
    .pipe(rename({suffix: '.min'}))
    .pipe(dest(PATH.jsFolder));
}

function pugIntoHtml() {
  return src('*.pug')
    .pipe(pug({
      pretty: true
    }))
    .pipe(dest(PATH.htmlFolder));
}

function watchFiles() {
  syncInit();
  if (!option) watch(PATH.scssFiles, series(scss));
  if (option === '--dev') watch(PATH.scssFiles, series(scssDev));
  if (option === '--css') watch(PATH.cssFiles, sync);
  if (option === '--pug') watch(PATH.pugFiles, series(pugIntoHtml));
  watch(PATH.htmlFiles, sync);
  watch(PATH.jsFiles, sync);
}

task('pug', series(pugIntoHtml));
task('comb', series(comb));
task('scss', series(scss));
task('cssmin', scssMin);
task('cs', series(createStructure));
task('watch', watchFiles);
task('dev', series(scssDev));
task('conjs', series(concatJS));
task('minjs', series(minJS));
