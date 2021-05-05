// Template Engine
// simply read html and cache

const fs = require("fs");
// const { dirname } = require("path");

const tengine = Object.create(null);
tengine.memory = Object.create(null);

tengine.setViewsDirectory = async (subdir, dev) => {
    if (typeof subdir !== "string" || subdir === "") {
        throw "not valid arg for path"
    }
    //must be a subdirectory 
    const path = `${__dirname}/${subdir}`;
    const dir = await fs.promises.opendir(path);
    for await (const dirent of dir) {
        // console.log(dirent.name);
        if (!dirent.isFile) {
            continue;
        }
        // html files only
        if (dirent.name.substr(-4, 4) !== "html") {
            continue;
        }

        tengine.readFromDirEntry(path, dirent);
    }

    //in development setup watcher
    if (dev === true) {
        tengine.setDevWatcher(path);
    }
};
/**
 * 
 * @param {String} path 
 * @param {Dirent} dirent 
 */
tengine.readFromDirEntry = (path, dirent) => {
    let fname = `${path}/${dirent.name}`;
    fs.readFile(fname, 'utf8', (err, fd) => {
        if (err) {
            // silent fail and continue
            console.log(err);
            return;
        }
        let name = dirent.name.replace(".html", "");
        //save file contents in memory
        tengine.memory[name] = fd;
        // console.log(fd);
    });
};

/**
 * 
 * @param {String} path 
 * @param {String} filename 
 */
tengine.readFromFilename = (path, filename) => {
    let fname = `${path}/${filename}`;
    fs.readFile(fname, 'utf8', (err, fd) => {
        if (err) {
            // silent fail and continue
            console.log(err);
            return;
        }
        let name = filename.replace(".html", "");
        //save file contents in memory
        tengine.memory[name] = fd;
        // console.log(fd);
    });
};
/**
 * Full Path must be provided
 * @param {String} filename
 * @param {String} asprop
 */
tengine.addFile = (filename, asprop) => {
    fs.readFile(filename, 'utf8', (err, fd) => {
        if (err) {
            // silent fail and continue
            console.log(err);
            return;
        }
        //save file contents in memory
        tengine.memory[asprop] = fd;
        // console.log(fd);
    });
};
/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {String} view 
 */
tengine.render = (req, res, view) => {
    if (typeof view !== "string" || view === "") {
        throw "not valid arg for view"
    }
    if (tengine.memory[view] === undefined) {
        res.redirect("/404");
    }
    res.write(tengine.memory[view]);
    res.end();
};

/**
 * the 404 by default, in theory this should be never called and prettier page shall be used.
 * @param {*} req 
 * @param {*} res
 * @returns void
 */
tengine.default = (req, res) => {
    res.write("<h1>File Not Found</h1>");
    res.write('<a href="/">Go Back</a>');
    res.end();
};
/**
 * 
 * @param {String} path 
 */
tengine.setDevWatcher = (path) => {
    fs.watch(path, { encoding: 'utf-8' }, (eventType, filename) => {
        if (eventType === "change") {
            // reread and resave
            tengine.readFromFilename(path, filename);
        }
        if (eventType === "rename") {
            tengine.readFromFilename(path, filename);
        }

        console.log(eventType, filename);
    })
};

module.exports = tengine;