const os = require('os');
const path = require('path');
const express = require('express');
const Docker = require('dockerode');
const streamCleanser = require('docker-stream-cleanser');

// Initialize web application.
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// List all containers.
const getContainers = (cb) => {
  try {
    var docker = new Docker({ socketPath: '/var/run/docker.sock' });
    docker.listContainers(cb);
  } catch (e) {
    return cb(e, [ ]);
  }
};

// List container logs.
app.get('/inspect/:id',
  (req, res) => {
    try {
      console.log('Loading logs for:', req.params.id);

      var docker = new Docker({ socketPath: '/var/run/docker.sock' });
      var container = docker.getContainer(req.params.id);
      container.inspect((err, data) => {
        if (err) {
          console.log('Error:', err);
          return res.json(err);
        }

        return res.json(data);
      });
    } catch (e) {
      res.json(err);
    }
  });

// List container logs.
app.get('/logs/:id',
  (req, res) => {
    try {
      console.log('Loading logs for:', req.params.id);

      var docker = new Docker({ socketPath: '/var/run/docker.sock' });
      var container = docker.getContainer(req.params.id);
      container.logs({ stderr: true, stdout: true, tail: 100 }, (err, logs) => {
        try {
          if (err) {
            console.log('Error:', err);
            return res.json(err);
          }

          var cleanLogs = streamCleanser();
          logs.on('end', () => {
            cleanLogs.end();
          });

          logs.pipe(cleanLogs).pipe(res);
        } catch(e) {
          res.json(e);
        }
      });
    } catch (e) {
      res.json(err);
    }
  });

// Overview.
app.get('/',
  (req, res) => {
    getContainers((err, containers) => {
      var interfaces = os.networkInterfaces();
      var addresses = Object.keys(interfaces)
        .reduce((result = [], key) => {
          interfaces[key].forEach(ip => result.push({ interface: key, address: ip.address }));
          return result;
        }, []);

      res.locals = {
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

console.log(`Listening on http://localhost:3000`);
app.listen(3000);
