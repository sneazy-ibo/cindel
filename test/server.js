import { HMRServer } from "../dist/index.js";

const logFiles = process.argv.includes('-lf');
const logProxyCors = process.argv.includes('-lpc');
const logProxyWS = process.argv.includes('-lpw');

const server = new HMRServer({
  port: 2000,
  // watchFiles: false,
  watch: ['test/src'],
  ignore: ['test/src/**/*.no.js'],
  cold: ['test/src/**/*.cold.js'],
  static: '.',
  // injectLoader: 'test/loader.mjs',
  indexPath: 'test/index.html',
  filesEndpoint: true,
  configEndpoint: true,
  tls: {
    key: 'localhost-key.pem',
    cert: 'localhost.pem'
  },
  corsProxy: '/cors',
  wsProxy: {
    prefix: '/proxy',
    headers: {
      'Origin': 'https://www.example.com'
    }
  },
  logFiles,
  logProxy: {
    cors: logProxyCors,
    ws: logProxyWS
  }
});

server.start();