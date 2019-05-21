
import * as config from '../../config/index.json'
import { plugins, addOns } from './plugins'
import cluster from 'cluster';
import { EventEmitter } from 'events';
import { Job } from 'bull';
import { reindex, makeIndexesIfNotExist } from './reindex';





if (cluster.isMaster) {
    makeIndexesIfNotExist().then(() => {
        let emmiter = new EventEmitter()
        let finishjobs: Array<any> = [];
        emmiter.on('drained', (data) => {
            finishjobs.push(data)
            console.log(finishjobs.length ,"<====>",config.repositories.length)
            console.log("-----------------------------------");
            console.log(finishjobs);
            if (finishjobs.length == config.repositories.length) {
                finishjobs = [];
                console.log("All indexing finished");
                console.log("Starting AddOn's");
                let promisesArray:any =[];
                config.AddOns.filter((addOn: any) => addOn.active).forEach((fn)=>{
                    promisesArray.push(addOns[fn.name](fn.param ? fn.param : null))
                })
                Promise.all(promisesArray).then(()=>{
                    console.log("AddOn's finished");
                    reindex();
                })
                // .reduce((promiseChain: any, currentTask: any) => {
                //     return promiseChain.then((chainResults: any) => {
                //         console.log('start addOn ', currentTask.name)
                //         if (addOns[currentTask.name])
                //             return addOns[currentTask.name](currentTask.param ? currentTask.param : null).then((currentResult: any) =>
                //                 [...chainResults, currentResult]
                //             )
                //         else
                //             console.log("addOn ", currentTask.name, "is not registered")
                //     }
                //     );
                // }, Promise.resolve([])).then((arrayOfResults: any) => {
                //     console.log("AddOn's finished");
                //     console.log(arrayOfResults);
                //     reindex();
                //     // Do something with all results
                // }).catch((e: Error) => console.error(e));
            }
        })
        config.repositories.forEach((repo) => {
            let job = new plugins[repo.type](repo)
            job.init();
            job.fetchQueue.on('global:drained', () => {
                job.fetchQueue.getActive().then((data: Array<Job>) => {
                    if (data.length == 0)
                        var time = setInterval(() => {
                            console.log("fetch finish waiting for index to finish")
                            job.indexQueue.getActive().then((data: Array<Job>) => {
                                if (data.length == 0) {
                                    clearInterval(time)
                                    emmiter.emit('drained', job.repo)
                                    console.log("index finish")
                                }
                            })
                        }, 1000)
                })
            })
        })
        const numCPUs = require('os').cpus().length;

        // Create a worker for each CPU
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }
        // Listen for dying workers
        cluster.on('exit', function () {
            cluster.fork();
        });
    }).catch(e => console.log(e))
} else {
    config.repositories.forEach((repo) => {
        new plugins[repo.type](repo).process();
    });

}