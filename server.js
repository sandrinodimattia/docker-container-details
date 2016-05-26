const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const sanitize = require("sanitize-filename");
const docker = require('./lib/docker');

// Initialize web application.
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

const getDirectoryContents = (path, cb) => {
  fs.readdir(path, (err, files) => {
    if (err) {
      return cb(err);
    }

    cb(null, files);
  });
}

// Overview.
app.get('/',
  (req, res) => {
    getDirectoryContents('/var/data', (err, files = []) => {
      docker.getContainers((err, containers = []) => {

        var interfaces = os.networkInterfaces();
        var addresses = Object.keys(interfaces)
          .reduce((result = [], key) => {
            interfaces[key].forEach(ip => result.push({ interface: key, address: ip.address }));
            return result;
          }, []);

        res.locals = {
          files: files,
          os: {
            cpus: os.cpus().length,
            hostname: os.hostname(),
            platform: os.platform(),
            release: os.release(),
            totalmem: os.totalmem(),
            type: os.type(),
          },
          containers: containers.map(container => {
            return {
              id: container.Id,
              details: JSON.stringify(container, null, 2)
            }
          }),
          addresses: addresses,
          env: Object.keys(process.env).sort().map(k => {
            return {
              key: k,
              value: process.env[k]
            };
          })
        };

        res.render('index');
      });
    });
  });

// List container logs.
app.get('/inspect/:id',
  (req, res) => {
    docker.getContainerDetails(req.params.id, (err, details) => {
      if (err) {
        console.log('Error:', err);
        return res.json(err);
      }

      return res.json(details);
    });
  });

// List container logs.
app.get('/logs/:id',
  (req, res) => {
    docker.getContainerLogs(req.params.id, 100, (err, stream) => {
      if (err) {
        console.log('Error:', err);
        return res.json(err);
      }

      return stream.pipe(res);
    });
  });

// File contents.
app.get('/file/:filename',
(req, res) => {
  fs.readFile('/var/data/' + req.params.filename, 'utf8', (err, data) => {
    if (err) {
      return res.json(err);
    }

    res.writeHead(200, {'Content-Type': 'text'});
    res.write(data);
    res.end();
  });
});

console.log(`Listening on http://localhost:3000`);
app.listen(3000);
