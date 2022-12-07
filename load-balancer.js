const { spawn } = require('child_process');
const httpProxy = require('http-proxy');
const http = require("http");
const path = require("path");

let processes = [];
let destinations = [];
let instances = process.argv[3] || 8;
let proxy = httpProxy.createProxyServer();
const artisan = path.resolve(process.argv[2]);

const loadBalancer = {

    init: () => {
        loadBalancer.startInstances().then(() => {
            console.log('instances started')
        }).then(loadBalancer.startProxy).then(() => {
            console.log('proxy started')
        });
        process.on('SIGINT', loadBalancer.killProcesses);
        process.on('SIGTERM', loadBalancer.killProcesses);
    },

    startProxy: () => {
        const server = http.createServer((req, res) => {
            const target = destinations[Math.floor(Math.random() * destinations.length)];
            console.log(`[${destinations.indexOf(target)}][${target}]: ` + req.url);
            proxy.web(req, res, { target });
        });
        server.listen(5000, () => {
            console.log('Load balancer listening on port 5000');
        });
    },

    startInstances: async () => {
        for (let i = 0; i < instances; i++) {
            destinations.push('http://127.0.0.1:' + (3000+i));
            const instance = spawn('php', [artisan, 'serve', `--port=${3000+i}`]);
            processes.push(instance);
            console.log(`Worker ${i} is listening on port ${3000+i}`);
        }
        return Promise.resolve();
    },

    killProcesses: () => {
        processes.forEach(process => process.kill());
    },

};

loadBalancer.init();