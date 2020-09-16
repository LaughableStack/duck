const http = require('http')

module.exports.duckServer = class duckServer {
    constructor(
        tokenAPI, 
        anonAPI, 
        port = 3735, 
        context = {}, 
        watchdog = req => Object({accepted: true}),
        errorProcessor = error => error
    ) {
        this.context = context;
        this.tokenAPI = tokenAPI;
        this.anonAPI = anonAPI;
        this.watchdog = watchdog;
        this.duck = true;
        if (port==-1) return;
        // initialize server on port
        this.server = http.createServer((req,res) => {
            try {
                this.handle(req,res);
            }
            catch(error) {
                res.end(errorProcessor(error));
            }});
        this.server.listen(parseInt(port));
    }

    async handle(req, res) {
        let report = this.watchdog(req);
        if (!report.accepted) return res.send(report.error);
        let reqStream = [];
        req.on('data', (chunkData) => {
          reqStream.push(chunkData);
        });
        req.on('end', async () => {
            let data = JSON.parse(reqStream);
            let result = await this.apiHandle(data);
            res.end(JSON.stringify(result));
        });
    }
    async apiHandle(data) {
        let activeAPI = data.token ? await this.userAPI(this.context, data.token) : this.anonAPI(this.context);
        return await activeAPI[data.method](data.content);
    }
}