const Docker = require('dockerode');
const streamCleanser = require('docker-stream-cleanser');

const getDockerClient = (cb) => {
  try {
    return cb(null, new Docker({ socketPath: '/var/run/docker.sock' }));
  } catch (e) {
    return cb(e);
  }
}

const getDockerContainerClient = (containerId, cb) => {
  getDockerClient((err, client) => {
    if (err) {
      return cb(err);
    }

    try {
      return cb(null, client.getContainer(containerId));
    } catch (e) {
      return cb(e);
    }
  });
}

module.exports.getContainers = (cb) => {
  getDockerClient((err, client) => {
    if (err) {
      return cb(err);
    }

    client.listContainers(cb);
  });
}

module.exports.getContainerDetails = (containerId, cb) => {
  getDockerContainerClient(containerId, (err, client) => {
    if (err) {
      return cb(err);
    }

    client.inspect((err, data) => {
      if (err) {
        return cb(err);
      }

      return cb(null, data);
    });
  });
};

module.exports.getContainerLogs = (containerId, lines, cb) => {
  getDockerContainerClient(containerId, (err, client) => {
    if (err) {
      return cb(err);
    }

    client.logs({ stderr: true, stdout: true, tail: lines }, (err, logs) => {
      try {
        if (err) {
          return cb(err);
        }

        var cleanLogs = streamCleanser();
        logs.on('end', () => {
          cleanLogs.end();
        });

        return cb(null, logs.pipe(cleanLogs));
      } catch(e) {
        return cb(e);
      }
    });
  });
};
