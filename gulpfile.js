/**
 * Run npm install
 */

//noinspection JSLint
var gulp     = require("gulp"),               // Gulp JS
out          = require("gulp-out"),           // output to file
minifyHTML   = require("gulp-minify-html"),   // min HTML
csso         = require("gulp-csso"),          // CSS min
less         = require("gulp-less"),          // LESS
concat       = require("gulp-concat"),        // concat
uglify       = require("gulp-uglify"),        // JS min
ejsmin       = require("gulp-ejsmin"),        // EJS min
header       = require("gulp-header"),        // banner maker
mkdirp       = require("mkdirp"),             // mkdir
fs           = require("fs"),                 // fs
autoprefixer = require('gulp-autoprefixer'),  // CSS autoprefixer
replace      = require("gulp-replace");       // replace

var src     = "./src",
    srcJs   = src + "/js",
    srcLess = src + "/less";

var dist    = "./dist",
    distJs  = dist + "/js",
    distCss = dist + "/css";

var templates   = "/templates",
    collections = "/collections",
    lib         = "/lib",
    models      = "/models",
    views       = "/views";

var pkg = require('./package.json');

var banner = [
    '/**',
    ' * Copyright (c) <%= new Date().getFullYear() %> <%= pkg.author %>',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @build <%= pkg.lastBuildDateUtc %>',
    ' * @link <%= pkg.repository %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''
].join('\n');

var dateHelper = {
    twoDigits: function (d) {
        if (0 <= d && d < 10)
            return "0" + d.toString();

        if (-10 < d && d < 0)
            return "-0" + (-1 * d).toString();

        return d.toString();
    },

    /**
     * @param {Date} d
     */
    toMysqlFormat: function (d) {
        return d.getUTCFullYear() + "-" + this.twoDigits(1 + d.getUTCMonth())
            + "-" + this.twoDigits(d.getUTCDate()) + " "
            + this.twoDigits(d.getUTCHours())
            + ":" + this.twoDigits(d.getUTCMinutes()) + ":"
            + this.twoDigits(d.getUTCSeconds());
    },

    /**
     * @param {Date} d
     */
    toUnixTimestamp: function (d) {
        return Math.floor(d.getTime() / 1000);
    }
};

function buildAmd() {
    gulp
        .src([
            srcJs + lib + "/*.js",
            srcJs + models + "/*.js",
            srcJs + collections + "/*.js",
            srcJs + views + "/*.js",
            srcJs + "/templates.js",
            srcJs + "/main.js"
        ])
        .pipe(concat("modules.js"))
        .pipe(uglify({mangle: false}))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest(distJs));
}

function buildTemplates() {
    var distDir = distJs + templates,
        srcDir = srcJs + templates;

    mkdirp(distDir);

    gulp
        .src(srcDir + "/*.ejs")
        .pipe(ejsmin({removeComment: false}))
        .pipe(gulp.dest(distDir));
}

function buildTplPlugin() {
    var srcDir = srcJs,
        distDir = distJs,
        file = "/tpl.js";

    mkdirp(distDir);

    gulp
        .src(srcDir + file)
        .pipe(uglify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(out(distDir + file));
}

function buildHtml() {
    var opts = {
        conditionals: true,
        spare:        true,
        empty:        true,
        cdata:        true,
        quotes:       true,
        loose:        false
    };

    gulp.src("./index-src.html")
        .pipe(minifyHTML(opts))
        .pipe(replace("/src/js/main", "/dist/js/modules"))
        .pipe(replace("##TITLE##", pkg.title || "Unknown"))
        .pipe(replace("##DESCRIPTION##", pkg.description || "Unknown"))
        .pipe(replace("##AUTHOR##", pkg.author || "Unknown"))
        .pipe(replace("##REPOSITORY##", pkg.repository || "Unknown"))
        .pipe(replace("##VERSION##", pkg.version || "Unknown"))
        .pipe(out("./index.html"));
}

function buildReadme() {
    gulp.src(src + "/README.md")
        .pipe(replace("##TITLE##", pkg.title || "Unknown"))
        .pipe(replace("##NAME##", pkg.name || "Unknown"))
        .pipe(replace("##DESCRIPTION##", pkg.description || "Unknown"))
        .pipe(replace("##AUTHOR##", pkg.author || "Unknown"))
        .pipe(replace("##REPOSITORY##", pkg.repository || "Unknown"))
        .pipe(replace("##VERSION##", pkg.version || "Unknown"))
        .pipe(replace("##DATE##", pkg.lastBuildDateUtc || "Unknown"))
        .pipe(out("./README.md"));
}

function buildCss() {
    mkdirp(distCss);

    gulp
        .src(srcLess + "/main.less")
        .pipe(less())
        .pipe(autoprefixer({
            browsers: [
                "Android 2.3",
                "Android >= 4",
                "Chrome >= 20",
                "Firefox >= 24",
                "Explorer >= 8",
                "iOS >= 6",
                "Opera >= 12",
                "Safari >= 6"
            ]
        }))
        .pipe(csso())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(out(distCss + "/app.css"));
}

function versionIncrement() {
    var v = (pkg.version || "0.0.0").split(".");

    pkg.version = [
        v[0] ? v[0] : 0,
        v[1] ? v[1] : 0,
        (v[2] ? parseInt(v[2]) : 0) + 1
    ].join(".");

    writeJsonFile("./package.json", pkg);
}

function dateUpdate() {
    var d = new Date();
    pkg.lastBuildDate = dateHelper.toUnixTimestamp(d);
    pkg.lastBuildDateUtc = d.toUTCString();
    writeJsonFile("./package.json", pkg);
}

function readJsonFile(file, options) {
    try {
        return JSON.parse(fs.readFileSync(file, options))
    } catch (err) {
        return null
    }
}

function writeJsonFile(file, obj, options) {
    var spaces = 2,
        str = JSON.stringify(obj, null, spaces) + '\n';

    //noinspection JSUnresolvedFunction
    return fs.writeFileSync(file, str, options);
}

gulp.task("build_css", buildCss);
gulp.task("build_html", buildHtml);
gulp.task("build_tpl_plugin", buildTplPlugin);
gulp.task("build_templates", buildTemplates);
gulp.task("build_amd", buildAmd);
gulp.task("build_readme", buildReadme);

gulp.task("watch", function () {
    gulp.watch(srcLess + "/**/*.less", ["build_css"]);
    gulp.watch("./index-src.html", ["build_html"]);
    gulp.watch(srcJs + "/lib/tpl.js", ["build_tpl_plugin"]);
    gulp.watch(srcJs + templates + "/**/*.ejs", ["build_templates"]);

    gulp.watch(srcJs + collections + "/**/*.js", ["build_amd"]);
    gulp.watch(srcJs + lib + "/**/*.js", ["build_amd"]);
    gulp.watch(srcJs + models + "/**/*.js", ["build_amd"]);
    gulp.watch(srcJs + views + "/**/*.js", ["build_amd"]);
    gulp.watch(srcJs + "/main.js", ["build_amd"]);
    gulp.watch(srcJs + "/templates.js", ["build_amd"]);

    gulp.watch(src + "/README.md", ["build_readme"]);
});

gulp.task("build", function () {
    dateUpdate();
    versionIncrement();
    buildCss();
    buildHtml();
    buildTplPlugin();
    buildTemplates();
    buildAmd();
    buildReadme();
});