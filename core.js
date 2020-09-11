const http = require('http')

module.exports.duckServer = class duckServer {
    constructor(
        port = 3735, 
        context = {}, 
        tokenAPI, 
        anonAPI, 
        watchdog = req => {accepted: true},
        errorProcessor = error => error
    ) {
        this.context = context
        this.tokenAPI = tokenAPI
        this.anonAPI = anonAPI
        this.watchdog = watchdog
        // init function
        this.server = http.createServer((req,res) => {
            try {
                this.handle(req,res)
            }
            catch(error) {
                res.end(errorProcessor(error))
            }});
        this.server.listen(parseInt(port));
    }

    async handle(req, res) {
        let report = this.watchdog(req)
        if (!report.accepted) return res.send(report.error)
        let reqStream = [];
        req.on('data', (chunkData) => {
          reqStream.push(chunkData)
        });
        req.on('end', async () => {
            let data = JSON.parse(reqStream);
            let activeAPI = data.token ? await this.userAPI(this.context, data.token) : this.anonAPI;
            let result = await activeAPI[data.method](data.content);
            res.end(JSON.stringify(result));
        });
    }
}