const { spawn } = require('child_process');
const httpProxy = require('http-proxy');
const http = require("http");
const path = require("path");

let processes = [];
let destinations = [];
let instances = parseInt(process.argv[3]) || 8;
let port = parseInt(process.argv[4]) || 8000;
let proxy = httpProxy.createProxyServer();
const artisan = path.resolve(process.argv[2]);

let roundRobinCounter = 0;

const loadBalancer = {

    init: async () => {
        try {
            await loadBalancer.startInstances();
            console.log('Instances started');
            loadBalancer.startProxy();
            console.log('Proxy started');
        } catch (err) {
            console.error('Error initializing load balancer:', err);
            await loadBalancer.killProcesses();
        }

        process.on('SIGINT', loadBalancer.handleExit);
        process.on('SIGTERM', loadBalancer.handleExit);
        process.on('exit', loadBalancer.handleExit);
    },

    startProxy: () => {
        const server = http.createServer((req, res) => {
            const target = destinations[roundRobinCounter % destinations.length];
            roundRobinCounter++;
            console.log(`[${destinations.indexOf(target)}][${target}]: ` + req.url);

            proxy.web(req, res, { target }, (error) => {
                console.error(`Error with proxying to ${target}:`, error);
                res.writeHead(500);
                res.end("Error proxying request");
            });
        });

        server.listen(port, () => {
            console.log('Load balancer listening on port ' + port);
        });
    },

    startInstances: async () => {
        for (let i = 0; i < instances; i++) {
            const port = 3000 + i;
            destinations.push(`http://127.0.0.1:${port}`);
            try {
                const instance = spawn('php', [artisan, 'serve', `--port=${port}`], {
                    stdio: 'ignore',
                    detached: true
                });

                processes.push(instance);
                console.log(`Worker ${i} is listening on port ${port}`);

                instance.on('error', (err) => {
                    console.error(`Failed to start worker ${i} on port ${port}:`, err);
                });

                instance.on('exit', (code) => {
                    console.log(`Worker ${i} on port ${port} exited with code ${code}`);
                });
            } catch (err) {
                console.error(`Error starting instance on port ${port}:`, err);
            }
        }
    },

    killProcesses: async () => {
        await Promise.all(processes.map(proc => new Promise(resolve => {
            // console.log(`Killing process: ${proc.pid}`);
            try {
                process.kill(-proc.pid);
                proc.on('exit', resolve);
            } catch (error) {
                console.error(`Failed to kill process ${proc.pid}:`, error);
                resolve();
            }
        })));

        console.log('All processes terminated');
        processes = [];
    },

    handleExit: async () => {
        await loadBalancer.killProcesses();
        process.exit();
    }

};

loadBalancer.init();
